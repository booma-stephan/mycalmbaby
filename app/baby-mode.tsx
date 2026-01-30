import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  BackHandler,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { designTokens } from './styles/designTokens';
import AudioManager from './utils/AudioManager';
import AnimationManager, { AnimationConfig, AnimationElement } from './utils/AnimationManager';
import { isGuidedAccessEnabled, addGuidedAccessListener, startListening, stopListening } from '../modules/expo-guided-access';
import { debug } from './utils/debug';

// Animation imports
import BasicShapesAnimation from './animations/basic-shapes/animation';
import SpaceJourneyAnimation from './animations/space-journey/animation';
import BurstingBubblesAnimation from './animations/bursting-bubbles/animation';

const { width, height } = Dimensions.get('window');

const REMINDER_DISPLAY_TIME = 5000; // 5 seconds
const REMINDER_FADE_TIME = 500;
const CORNER_SIZE = 80;

type Corner = 'TL' | 'TR' | 'BL' | 'BR';

export default function BabyModeScreen() {
  const [guidedAccessActive, setGuidedAccessActive] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationConfig | undefined>();
  const [animationElements, setAnimationElements] = useState<AnimationElement[]>([]);
  const [unlockSequence, setUnlockSequence] = useState<Corner[]>([]);
  const [currentSequence, setCurrentSequence] = useState<Corner[]>([]);

  const reminderOpacity = useRef(new Animated.Value(0)).current;
  const exitHintOpacity = useRef(new Animated.Value(0)).current;
  const animationValue = useRef(new Animated.Value(0)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize screen
  useEffect(() => {
    const initialize = async () => {
      // Keep screen awake
      activateKeepAwake();

      // Lock orientation
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } catch (e) {
        debug('Orientation lock failed:', e);
      }

      // Setup audio
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        debug('Audio setup failed:', e);
      }

      // Load animation
      const animationManager = AnimationManager.getInstance();
      await animationManager.initialize();
      const selected = animationManager.getSelectedAnimation();
      if (selected) {
        setCurrentAnimation(selected);
        setAnimationElements(selected.elements || []);
      }

      // Load unlock sequence
      const savedSequence = await AsyncStorage.getItem('unlockSequence');
      if (savedSequence) {
        setUnlockSequence(JSON.parse(savedSequence));
      }

      // Start white noise if enabled
      const whiteNoiseEnabled = await AsyncStorage.getItem('whiteNoiseEnabled');
      if (whiteNoiseEnabled === 'true') {
        await AudioManager.play();
      }

      // Start animations
      startAnimations();
    };

    initialize();

    return () => {
      deactivateKeepAwake();
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  // Start visual animations
  const startAnimations = () => {
    Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(rotationValue, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Monitor Guided Access status
  useEffect(() => {
    const checkStatus = () => {
      const isActive = isGuidedAccessEnabled();
      setGuidedAccessActive(isActive);

      // Show reminder if GA is not active
      if (!isActive) {
        showGuidedAccessReminder();
      }
    };

    checkStatus();
    startListening();

    const subscription = addGuidedAccessListener((event) => {
      setGuidedAccessActive(event.isEnabled);
      if (!event.isEnabled) {
        showGuidedAccessReminder();
      }
    });

    return () => {
      subscription.remove();
      stopListening();
    };
  }, []);

  // Block back button on Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Block back button - show exit hint instead
        if (!guidedAccessActive) {
          showExitHintMessage();
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [guidedAccessActive])
  );

  const showGuidedAccessReminder = () => {
    setShowReminder(true);
    Animated.timing(reminderOpacity, {
      toValue: 1,
      duration: REMINDER_FADE_TIME,
      useNativeDriver: true,
    }).start();

    // Clear any existing timer
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
    }

    // Hide after display time
    reminderTimerRef.current = setTimeout(() => {
      Animated.timing(reminderOpacity, {
        toValue: 0,
        duration: REMINDER_FADE_TIME,
        useNativeDriver: true,
      }).start(() => {
        setShowReminder(false);
      });
    }, REMINDER_DISPLAY_TIME);
  };

  const showExitHintMessage = () => {
    setShowExitHint(true);
    Animated.timing(exitHintOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(exitHintOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowExitHint(false);
      });
    }, 2000);
  };

  // Handle corner taps for unlock sequence (fallback when GA is not active)
  const handleCornerTap = (corner: Corner) => {
    if (guidedAccessActive) {
      return; // GA handles exit, no need for corner sequence
    }

    // Clear previous timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    const newSequence = [...currentSequence, corner];
    setCurrentSequence(newSequence);

    // Check if sequence matches
    if (newSequence.length === unlockSequence.length) {
      const isCorrect = newSequence.every((c, i) => c === unlockSequence[i]);
      if (isCorrect) {
        exitBabyMode();
      } else {
        // Wrong sequence - reset
        setCurrentSequence([]);
        showExitHintMessage();
      }
    } else if (newSequence.length < unlockSequence.length) {
      // Start timeout to reset sequence
      sequenceTimeoutRef.current = setTimeout(() => {
        setCurrentSequence([]);
      }, 3000);
    }
  };

  const exitBabyMode = async () => {
    deactivateKeepAwake();
    await AudioManager.stop();
    router.back();
  };

  const getCornerFromPosition = (x: number, y: number): Corner | null => {
    if (x < CORNER_SIZE && y < CORNER_SIZE) return 'TL';
    if (x > width - CORNER_SIZE && y < CORNER_SIZE) return 'TR';
    if (x < CORNER_SIZE && y > height - CORNER_SIZE) return 'BL';
    if (x > width - CORNER_SIZE && y > height - CORNER_SIZE) return 'BR';
    return null;
  };

  const handleScreenTouch = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    const { locationX, locationY } = event.nativeEvent;
    const corner = getCornerFromPosition(locationX, locationY);
    if (corner) {
      handleCornerTap(corner);
    }
  };

  const renderAnimation = () => {
    if (!currentAnimation) {
      return <BasicShapesAnimation
        animationValue={animationValue}
        rotationValue={rotationValue}
        scaleValue={scaleValue}
        elements={animationElements}
        width={width}
        height={height}
        styles={{}}
      />;
    }

    const animationId = currentAnimation.id;

    switch (animationId) {
      case 'space-journey':
        return (
          <SpaceJourneyAnimation
            width={width}
            height={height}
            elements={animationElements}
          />
        );
      case 'bursting-bubbles':
        return (
          <BurstingBubblesAnimation
            width={width}
            height={height}
            elements={animationElements}
          />
        );
      default:
        return (
          <BasicShapesAnimation
            animationValue={animationValue}
            rotationValue={rotationValue}
            scaleValue={scaleValue}
            elements={animationElements}
            width={width}
            height={height}
            styles={{}}
          />
        );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleScreenTouch}>
      <View style={styles.container}>
        <StatusBar hidden />

        {/* Animation Layer */}
        <View style={styles.animationContainer}>
          {renderAnimation()}
        </View>

        {/* Guided Access Reminder Overlay */}
        {showReminder && (
          <Animated.View style={[styles.reminderOverlay, { opacity: reminderOpacity }]}>
            <View style={styles.reminderContent}>
              <View style={styles.reminderIcon}>
                <Ionicons name="lock-open-outline" size={48} color={designTokens.colors.warning} />
              </View>
              <Text style={styles.reminderTitle}>Enable Kiosk Mode</Text>
              <Text style={styles.reminderText}>
                Triple-click the side button to activate Guided Access and lock the app.
              </Text>
              <View style={styles.reminderSteps}>
                <View style={styles.stepRow}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Triple-click side button</Text>
                </View>
                <View style={styles.stepRow}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>Tap &quot;Start&quot; in menu</Text>
                </View>
              </View>
              <Text style={styles.reminderDismiss}>Tap anywhere to dismiss</Text>
            </View>
          </Animated.View>
        )}

        {/* Exit Hint Overlay */}
        {showExitHint && (
          <Animated.View style={[styles.exitHintOverlay, { opacity: exitHintOpacity }]}>
            <Text style={styles.exitHintText}>
              {guidedAccessActive
                ? 'Triple-click side button to exit'
                : 'Use corner sequence to exit'}
            </Text>
          </Animated.View>
        )}

        {/* GA Status Indicator (small, unobtrusive) */}
        {!guidedAccessActive && (
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
          </View>
        )}

        {/* Corner Touch Zones (invisible, for sequence detection) */}
        {!guidedAccessActive && (
          <>
            <View style={[styles.cornerZone, styles.cornerTL]} />
            <View style={[styles.cornerZone, styles.cornerTR]} />
            <View style={[styles.cornerZone, styles.cornerBL]} />
            <View style={[styles.cornerZone, styles.cornerBR]} />
          </>
        )}

        {/* Progress indicator for unlock sequence */}
        {currentSequence.length > 0 && !guidedAccessActive && (
          <View style={styles.sequenceProgress}>
            {unlockSequence.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index < currentSequence.length && styles.progressDotFilled
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  animationContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  reminderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
  },
  reminderContent: {
    backgroundColor: designTokens.colors.white,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  reminderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designTokens.colors.aliceBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  reminderTitle: {
    fontSize: designTokens.typography.sizes.lg,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.charcoal,
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
  },
  reminderText: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: designTokens.spacing.lg,
  },
  reminderSteps: {
    width: '100%',
    marginBottom: designTokens.spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: designTokens.colors.primary,
    color: designTokens.colors.white,
    fontSize: designTokens.typography.sizes.sm,
    fontWeight: designTokens.typography.weights.bold,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: designTokens.spacing.md,
  },
  stepText: {
    flex: 1,
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.charcoal,
  },
  reminderDismiss: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.darkGray,
    fontStyle: 'italic',
  },
  exitHintOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  exitHintText: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: designTokens.colors.white,
    fontSize: designTokens.typography.sizes.sm,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.xl,
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designTokens.colors.warning,
  },
  cornerZone: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    // Uncomment to debug corner zones:
    // backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  cornerTL: {
    top: 0,
    left: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
  },
  sequenceProgress: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressDotFilled: {
    backgroundColor: designTokens.colors.primary,
    borderColor: designTokens.colors.primary,
  },
});
