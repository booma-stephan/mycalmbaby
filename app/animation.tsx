import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  BackHandler,
  ActivityIndicator,
  Text,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { designTokens } from './styles/designTokens';
import AnimationManager, {
  AnimationConfig,
  AnimationElement,
} from './utils/AnimationManager';
import { debug } from './utils/debug';
import AudioManager from './utils/AudioManager';
import {
  SWIPE_THRESHOLD,
  FEEDBACK_DURATION,
  SEQUENCE_TIMEOUT,
  CORNER_SIZE_RATIO,
  CORNER_SIZE_MIN,
} from './constants';

// Default animation components (fallbacks)
import BasicShapesAnimation from './animations/basic-shapes/animation';

import SpaceJourneyAnimation from './animations/space-journey/animation';

import BurstingBubblesAnimation from './animations/bursting-bubbles/animation';

const { width, height } = Dimensions.get('window');

type Corner = 'TL' | 'TR' | 'BL' | 'BR';

interface TouchZone {
  corner: Corner;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Dynamic corner size based on screen dimensions
const CORNER_SIZE = Math.max(CORNER_SIZE_MIN, Math.min(width, height) * CORNER_SIZE_RATIO);

export default function AnimationScreen() {
  const [unlockSequence, setUnlockSequence] = useState<Corner[]>([]);
  const [currentSequence, setCurrentSequence] = useState<Corner[]>([]);
  const [wrongSequenceIndicator, setWrongSequenceIndicator] = useState(false);
  // sleepTimer is loaded directly in init() to avoid stale state issues
  // We no longer need isPlaying state as we're using AudioManager
  const [currentAnimation, setCurrentAnimation] = useState<
    AnimationConfig | undefined
  >();
  const [animationElements, setAnimationElements] = useState<
    AnimationElement[]
  >([]);

  // We no longer need a sound reference as we're using AudioManager
  // const soundRef = useRef<Audio.Sound | null>(null);

  // Reference to the fadeOutAndExit function to use it outside useEffect
  const fadeOutAndExitRef = useRef<() => void>(() => {});

  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationValue = useRef(new Animated.Value(0)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Define touch zones for corners - much larger for better mobile experience
  const touchZones: TouchZone[] = [
    { corner: 'TL', x: 0, y: 0, width: CORNER_SIZE, height: CORNER_SIZE },
    {
      corner: 'TR',
      x: width - CORNER_SIZE,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
    },
    {
      corner: 'BL',
      x: 0,
      y: height - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
    },
    {
      corner: 'BR',
      x: width - CORNER_SIZE,
      y: height - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
    },
  ];

  // Store animation references so we can stop them when needed
  const animationRefs = useRef<{
    rotation: Animated.CompositeAnimation | null;
    scale: Animated.CompositeAnimation | null;
    opacity: Animated.CompositeAnimation | null;
  }>({ rotation: null, scale: null, opacity: null });

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Keep screen awake
        activateKeepAwake();

        // Enable audio for mobile devices
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });
        } catch (audioError: unknown) {
          debug('Audio mode setup failed:', (audioError as Error)?.message || 'Unknown error');
        }

        // Try to hide system UI (immersive mode) - only on mobile
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT
          );
        } catch (orientationError: unknown) {
          debug('Orientation lock not supported:', (orientationError as Error)?.message || 'Unknown error');
        }

        // Hide navigation bar on Android
        try {
          if (NavigationBar.setVisibilityAsync) {
            await NavigationBar.setVisibilityAsync('hidden');
          }
        } catch (navError: unknown) {
          debug('Navigation bar control not supported:', (navError as Error)?.message || 'Unknown error');
        }
      } catch (error) {
        debug('Failed to initialize screen:', error);
      }
    };

    const loadSettings = async (): Promise<{ timerMinutes: number }> => {
      let timerMinutes = 30; // Default value
      try {
        const savedSequence = await AsyncStorage.getItem('unlockSequence');
        const savedTimer = await AsyncStorage.getItem('sleepTimer');

        if (savedSequence) {
          setUnlockSequence(JSON.parse(savedSequence));
        }
        // Note: whiteNoiseEnabled is handled directly from AsyncStorage in init()
        // to avoid stale state issues
        if (savedTimer) {
          timerMinutes = parseInt(savedTimer);
        }

        // Load the selected animation
        const animationManager = AnimationManager.getInstance();
        await animationManager.initialize();
        const selectedAnimation = animationManager.getSelectedAnimation();
        if (selectedAnimation) {
          debug('Loaded animation:', selectedAnimation.name);
          setCurrentAnimation(selectedAnimation);
          setAnimationElements(selectedAnimation.elements || []);
        } else {
          debug('No animation selected, using default');
        }
      } catch (error) {
        debug('Failed to load settings:', error);
      }
      return { timerMinutes };
    };

    const setupAnimations = async () => {
      // Opacity animation
      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      opacityAnimation.start();
      animationRefs.current.opacity = opacityAnimation;

      // Rotation animation
      const rotationAnimation = Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();
      animationRefs.current.rotation = rotationAnimation;

      // Scale animation
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.8,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
      scaleAnimation.start();
      animationRefs.current.scale = scaleAnimation;
    };

    // Fade out animation and exit to main menu
    const fadeOutAndExit = async () => {
      try {
        // Fade out animation
        Animated.timing(animationValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          router.replace('/main-menu');
        });
      } catch (error) {
        debug('Fade out error:', error);
        router.replace('/main-menu');
      }
    };

    // Store the function in ref so it can be accessed outside useEffect
    fadeOutAndExitRef.current = fadeOutAndExit;

    // Start sleep timer to automatically return to main menu after specified minutes
    const startSleepTimer = (minutes: number) => {
      if (minutes > 0) {
        debug(`Sleep timer started: ${minutes} minutes`);
        // Store the timer reference so we can clear it if needed
        const timerRef = setTimeout(() => {
          debug('Sleep timer expired, returning to main menu');
          fadeOutAndExit();
        }, minutes * 60 * 1000);

        // Store the timer reference for cleanup
        sequenceTimeoutRef.current = timerRef;
      }
    };

    const cleanup = async () => {
      try {
        deactivateKeepAwake();

        // Stop all animations
        if (animationRefs.current.rotation) {
          animationRefs.current.rotation.stop();
        }
        if (animationRefs.current.scale) {
          animationRefs.current.scale.stop();
        }
        if (animationRefs.current.opacity) {
          animationRefs.current.opacity.stop();
        }

        // IMPORTANT: Do NOT stop white noise when exiting the animation
        // White noise should continue playing if it was enabled in the main menu
        // AudioManager will handle the state based on the toggle in main menu
        // Clear any existing sleep timer
        if (sequenceTimeoutRef.current) {
          debug('Clearing existing sleep timer');
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }

        // Restore navigation bar
        if (NavigationBar.setVisibilityAsync) {
          await NavigationBar.setVisibilityAsync('visible');
        }
      } catch (error) {
        debug('Cleanup error:', error);
      }
    };

    const init = async () => {
      await initializeScreen();
      const { timerMinutes } = await loadSettings();
      setupAnimations();

      // We should NOT use the local whiteNoiseEnabled state variable at all
      // Instead, directly check the saved value from AsyncStorage
      const savedWhiteNoise = await AsyncStorage.getItem('whiteNoiseEnabled');
      const shouldPlayWhiteNoise = savedWhiteNoise === 'true';

      // Ensure white noise state matches the saved toggle state
      if (shouldPlayWhiteNoise && !AudioManager.isWhiteNoisePlaying()) {
        // Toggle is ON but white noise is not playing - start it
        debug('Starting white noise based on saved toggle state');
        await AudioManager.play();
      } else if (!shouldPlayWhiteNoise && AudioManager.isWhiteNoisePlaying()) {
        // Toggle is OFF but white noise is playing - stop it
        debug('Stopping white noise based on saved toggle state');
        await AudioManager.stop();
      } else {
        debug('White noise state already matches saved toggle state');
      }

      // Start sleep timer if enabled and not already started
      // Use timerMinutes directly from loadSettings to avoid stale state
      if (timerMinutes > 0 && !sequenceTimeoutRef.current) {
        startSleepTimer(timerMinutes);
      }
    };

    init();

    // Handle Android back button
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Ignore back button in animation screen
        return true;
      }
    );

    return () => {
      cleanup();
      backHandler.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount - refs (animationValue, etc.) don't change

  // Additional protection against iOS back swipe gesture
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      debug('Animation screen focused - back gesture protection active');

      // Additional back handler for extra protection
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          debug('Hardware back press blocked in animation screen');
          return true; // Prevent default back action
        }
      );

      return () => {
        // Cleanup when screen loses focus
        debug('Animation screen unfocused - back gesture protection removed');
        backHandler.remove();
      };
    }, [])
  );

  const getCornerFromTouch = (x: number, y: number): Corner | null => {
    for (const zone of touchZones) {
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        debug(`Touch matched ${zone.corner}`);
        return zone.corner;
      }
    }
    return null;
  };

  const handleTouch = (x: number, y: number) => {
    const corner = getCornerFromTouch(x, y);

    if (!corner) return;

    const newSequence = [...currentSequence, corner];
    setCurrentSequence(newSequence);

    // Clear existing timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    // Check if sequence is complete
    if (newSequence.length === unlockSequence.length) {
      const isCorrect = newSequence.every(
        (corner, index) => corner === unlockSequence[index]
      );

      if (isCorrect) {
        // Correct sequence - unlock and stop everything
        fadeOutAndExitRef.current();
        return;
      } else {
        // Wrong sequence - show indicator and reset
        setWrongSequenceIndicator(true);
        setCurrentSequence([]);
        // Hide indicator after feedback duration
        setTimeout(() => setWrongSequenceIndicator(false), FEEDBACK_DURATION);
        return;
      }
    }

    // Set timeout to reset sequence if not completed in time
    sequenceTimeoutRef.current = setTimeout(() => {
      setCurrentSequence([]);
      // Show timeout indicator
      setWrongSequenceIndicator(true);
      setTimeout(() => setWrongSequenceIndicator(false), FEEDBACK_DURATION);
    }, SEQUENCE_TIMEOUT);
  };

  // Create pan responder for touch handling with swipe blocking
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evt, gestureState) => {
      // Block swipe gestures by checking movement distance
      const { dx, dy } = gestureState;

      // If movement exceeds threshold, it's likely a swipe - capture and block it
      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
        debug(`Swipe blocked: dx=${dx}, dy=${dy}`);
        return true; // Capture the gesture to prevent it from propagating
      }
      return false; // Allow small movements (taps)
    },
    onPanResponderGrant: (evt) => {
      const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
      const x = pageX || locationX || 0;
      const y = pageY || locationY || 0;
      handleTouch(x, y);
    },
    onPanResponderMove: (_evt, gestureState) => {
      // Block any movement to prevent swipe actions
      const { dx, dy } = gestureState;

      // If this is a swipe gesture, prevent any further action
      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
        return; // Do nothing for swipe movements
      }
    },
    onPanResponderRelease: (_evt, gestureState) => {
      // Only process release if it wasn't a swipe
      const { dx, dy } = gestureState;

      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
        debug('Swipe release blocked');
      }
    },
  });

  const renderAnimationElements = () => {
    // If no animation is selected or loaded, show a loading indicator
    if (!currentAnimation) {
      return (
        <View style={styles.animationContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.primary} />
        </View>
      );
    }

    // Determine which animation component to use based on the selected animation
    let AnimationComponent: React.ComponentType<any>;

    // Use the animation ID to select the appropriate component
    switch (currentAnimation.id) {
      case 'basic-shapes':
        AnimationComponent = BasicShapesAnimation;
        break;
      case 'space-journey':
        AnimationComponent = SpaceJourneyAnimation;
        break;

      case 'bursting-bubbles':
        AnimationComponent = BurstingBubblesAnimation;
        break;
      default:
        debug('No matching animation found for ID:', currentAnimation.id);
        AnimationComponent = BasicShapesAnimation;
    }

    // Check if AnimationComponent is valid before rendering
    if (!AnimationComponent) {
      debug('AnimationComponent is undefined or null');
      return (
        <View style={styles.animationContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.primary} />
          <View style={{ marginTop: 20 }}>
            <Text style={{ textAlign: 'center', color: designTokens.colors.error }}>
              Error loading animation
            </Text>
          </View>
        </View>
      );
    }

    try {
      // Render the selected animation component with all necessary props
      return (
        <AnimationComponent
          // Props for basic-shapes
          animationValue={animationValue}
          rotationValue={rotationValue}
          scaleValue={scaleValue}
          elements={animationElements}
          styles={styles}
          // Props for bursting-bubbles and space-journey
          width={width}
          height={height}
          onBackgroundTap={handleTouch}
          onAnimationLoaded={() => debug(`${currentAnimation.id} animation loaded`)}
        />
      );
    } catch (error) {
      debug('Error rendering animation component:', error);
      return (
        <View style={styles.animationContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.primary} />
          <View style={{ marginTop: 20 }}>
            <Text style={{ textAlign: 'center', color: designTokens.colors.error }}>
              Error rendering animation
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Main Animation Elements */}
      {renderAnimationElements()}

      {/* Sequence entry indicator dots - only show after first corner press */}
      {currentSequence.length > 0 && (
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.sequenceDot,
                currentSequence.length > index && styles.activeDot,
                wrongSequenceIndicator && styles.errorDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.aliceBlue,
  },
  dotsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    bottom: designTokens.spacing.xxl,
    alignSelf: 'center',
    zIndex: 10,
  },
  sequenceDot: {
    width: 16,
    height: 16,
    borderRadius: designTokens.borderRadius.sm,
    backgroundColor: designTokens.colors.mediumGray,
    marginHorizontal: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.lightGray,
  },
  activeDot: {
    backgroundColor: designTokens.colors.primary,
    borderColor: designTokens.colors.primaryDark,
  },
  errorDot: {
    backgroundColor: designTokens.colors.error,
    borderColor: designTokens.colors.anxietyRed,
  },
  animationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    borderRadius: designTokens.borderRadius.full,
  },
  square: {
    backgroundColor: designTokens.colors.darkGray,
  },
  triangle: {
    // Triangle styles are applied inline since they're more complex
  },
  wrongSequenceIndicator: {
    position: 'absolute',
    top: designTokens.spacing.xxl,
    alignSelf: 'center',
    width: 8,
    height: 8,
    borderRadius: designTokens.borderRadius.sm / 2,
    backgroundColor: designTokens.colors.error,
    opacity: 0.8,
  },
});
