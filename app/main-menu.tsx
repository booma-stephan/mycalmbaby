import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import AudioManager from './utils/AudioManager';
import { designTokens } from './styles/designTokens';
import {
  PillButton,
  Card,
  Toggle,
} from './components/UIComponents';
import AnimationCarousel from './components/AnimationCarousel';
import AnimationManager, { AnimationConfig } from './utils/AnimationManager';
import { debug } from './utils/debug';

type SleepTimer = 15 | 30 | 60;



export default function MainMenuScreen() {
  const [sleepTimer, setSleepTimer] = useState<SleepTimer>(30);
  const [whiteNoiseEnabled, setWhiteNoiseEnabled] = useState(true);
  const [animations, setAnimations] = useState<AnimationConfig[]>([]);
  const [selectedAnimationId, setSelectedAnimationId] = useState<string>('basic-shapes');


  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedWhiteNoise = await AsyncStorage.getItem('whiteNoiseEnabled');
        const savedTimer = await AsyncStorage.getItem('sleepTimer');
        // Ensure white noise playback matches saved state
        const shouldPlayWhiteNoise = savedWhiteNoise === 'true';
        setWhiteNoiseEnabled(shouldPlayWhiteNoise);
        
        // Explicitly set audio state to match the toggle
        if (shouldPlayWhiteNoise) {
          await AudioManager.play();
        } else {
          await AudioManager.stop();
        }
        if (savedTimer) {
          setSleepTimer(parseInt(savedTimer) as SleepTimer);
        }

        // Initialize animation manager
        const animationManager = AnimationManager.getInstance();
        await animationManager.initialize();
        setAnimations(animationManager.getAnimations());
        const selectedAnimation = animationManager.getSelectedAnimation();
        if (selectedAnimation) {
          setSelectedAnimationId(selectedAnimation.id);
        }
      } catch (error) {
        debug('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handlePlay = () => {
    router.push('/animation');
  };

  const handleSelectAnimation = async (animationId: string) => {
    setSelectedAnimationId(animationId);
    try {
      const animationManager = AnimationManager.getInstance();
      await animationManager.selectAnimation(animationId);
    } catch (error) {
      debug('Failed to select animation:', error);
      // Revert selection on error
      setSelectedAnimationId(selectedAnimationId);
    }
  };

  const handleSleepTimerChange = async (timer: SleepTimer) => {
    setSleepTimer(timer);
    await AsyncStorage.setItem('sleepTimer', timer.toString());
  };

  const handleWhiteNoiseToggle = async (value: boolean) => {
    setWhiteNoiseEnabled(value);
    try {
      const savedTimer = await AsyncStorage.getItem('sleepTimer');
      if (savedTimer) {
        setSleepTimer(parseInt(savedTimer) as SleepTimer);
      }
    } catch (error) {
      debug('Failed to get sleep timer:', error);
    }
    await AsyncStorage.setItem('whiteNoiseEnabled', value.toString());
    if (value) {
      await AudioManager.play();
    } else {
      await AudioManager.stop();
    }
  };



  const handleChangeUnlock = () => {
    router.push('/onboarding?step=setup-sequence');
  };

  const handleKioskSetup = () => {
    router.push('/kiosk-setup');
  };

  const renderSleepTimerSelector = () => (
    <Card style={styles.section}>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Sleep Timer</Text>
      </View>
      <View style={styles.segmentedControl}>
        {[15, 30, 60].map((timer) => (
          <PillButton
            key={timer}
            title={`${timer}m`}
            onPress={() => handleSleepTimerChange(timer as SleepTimer)}
            active={sleepTimer === timer}
            style={styles.timerButton}
          />
        ))}
      </View>
    </Card>
  );

  const renderWhiteNoiseToggle = () => (
    <Card style={styles.section}>
      <Toggle
        value={whiteNoiseEnabled}
        onValueChange={handleWhiteNoiseToggle}
        label="White Noise"
      />
    </Card>
  );



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/icons/splash-icon-light.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>My Calm Baby</Text>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Ionicons name="play" size={32} color={designTokens.colors.white} />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>

        {renderSleepTimerSelector()}
        {renderWhiteNoiseToggle()}
        
        {/* Animation Selection Carousel */}
        <AnimationCarousel
          animations={animations}
          selectedAnimation={selectedAnimationId}
          onSelectAnimation={handleSelectAnimation}
        />

        {/* Kiosk Mode Card */}
        <Card style={styles.section}>
          <TouchableOpacity style={styles.kioskButton} onPress={handleKioskSetup}>
            <View style={styles.kioskIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color={designTokens.colors.primary} />
            </View>
            <View style={styles.kioskTextContainer}>
              <Text style={styles.kioskTitle}>Kiosk Mode</Text>
              <Text style={styles.kioskSubtitle}>Lock app using iOS Guided Access</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={designTokens.colors.darkGray} />
          </TouchableOpacity>
        </Card>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.textButton} onPress={handleChangeUnlock}>
            <Text style={styles.textButtonText}>Change Unlock Sequence</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Toggle styles for consistency
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing.sm,
  },
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.aliceBlue,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  logoBackground: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#A8D5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  smallCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A8D5BA',
    position: 'absolute',
  },
  smallCircleTop: {
    top: 0,
    left: '50%',
    marginLeft: -4,
  },
  smallCircleRight: {
    right: 0,
    top: '50%',
    marginTop: -4,
  },
  smallCircleBottom: {
    bottom: 0,
    left: '50%',
    marginLeft: -4,
  },
  smallCircleLeft: {
    left: 0,
    top: '50%',
    marginTop: -4,
  },
  title: {
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
  },
  playButton: {
    backgroundColor: designTokens.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing.xl,
    gap: designTokens.spacing.sm,
    ...designTokens.shadows.md,
  },
  playButtonText: {
    color: designTokens.colors.white,
    fontSize: designTokens.typography.sizes.lg,
    fontWeight: designTokens.typography.weights.semibold,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: designTokens.typography.sizes.base,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
    marginBottom: designTokens.spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.lightGray,
    borderRadius: designTokens.borderRadius.sm,
    padding: designTokens.spacing.xs,
    gap: designTokens.spacing.xs,
  },
  timerButton: {
    flex: 1,
  },
  downloadButton: {
    minWidth: 100,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    height: 36,
  },
  segmentButtonActive: {
    backgroundColor: designTokens.colors.primary,
  },
  segmentButtonText: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    fontWeight: designTokens.typography.weights.medium,
  },
  segmentButtonTextActive: {
    color: designTokens.colors.white,
    fontWeight: designTokens.typography.weights.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.charcoal,
    fontWeight: designTokens.typography.weights.medium,
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: 24,
    gap: 16,
  },
  textButton: {
    paddingVertical: 12,
  },
  textButtonText: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.primary,
    fontWeight: designTokens.typography.weights.medium,
  },
  kioskButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kioskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designTokens.colors.aliceBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md,
  },
  kioskTextContainer: {
    flex: 1,
  },
  kioskTitle: {
    fontSize: designTokens.typography.sizes.base,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
  },
  kioskSubtitle: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.darkGray,
    marginTop: 2,
  },
});
