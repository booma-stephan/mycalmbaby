import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PrimaryButton,
  SecondaryButton,
  Card,
  SectionHeader,
} from './components/UIComponents';
import { designTokens } from './styles/designTokens';

type OnboardingStep = 'welcome' | 'explain-lock' | 'setup-sequence';
type Corner = 'TL' | 'TR' | 'BL' | 'BR';

const CORNER_POSITIONS = {
  TL: { top: 50, left: 50 },
  TR: { top: 50, right: 50 },
  BL: { bottom: 50, left: 50 },
  BR: { bottom: 50, right: 50 },
};

// Helper function to compare two arrays
function compareArrays(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value, index) => value === arr2[index]);
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [unlockSequence, setUnlockSequence] = useState<Corner[]>([]);
  const [tappedCorners, setTappedCorners] = useState<Corner[]>([]);
  const [showError, setShowError] = useState<boolean>(false);

  const handleCornerTap = (corner: Corner) => {
    // If we already have 4 corners and showing error, reset to start new sequence
    if (tappedCorners.length === 4 && showError) {
      setTappedCorners([corner]);
      setShowError(false);
      return;
    }
    
    // Reset error state when starting a new sequence
    if (tappedCorners.length === 0) {
      setShowError(false);
    }
    
    if (tappedCorners.length < 4) {
      const newTapped = [...tappedCorners, corner];
      setTappedCorners(newTapped);
      
      if (newTapped.length === 4) {
        // Show error indicator for 1 second before resetting
        if (unlockSequence.length > 0 && !compareArrays(newTapped, unlockSequence)) {
          setShowError(true);
          setTimeout(() => {
            setTappedCorners([]);
            setShowError(false);
          }, 1000);
        } else {
          setUnlockSequence(newTapped);
        }
      }
    }
  };

  const resetSequence = () => {
    setTappedCorners([]);
    setUnlockSequence([]);
    setShowError(false);
  };

  const confirmSequence = async () => {
    if (unlockSequence.length === 4) {
      try {
        // Use multiSet for atomic operation to prevent app entering bad state
        await AsyncStorage.multiSet([
          ['unlockSequence', JSON.stringify(unlockSequence)],
          ['hasCompletedOnboarding', 'true'],
        ]);

        // Verify the data was saved
        const results = await AsyncStorage.multiGet(['hasCompletedOnboarding', 'unlockSequence']);
        const verifyOnboarding = results[0][1];
        const verifySequence = results[1][1];

        if (verifyOnboarding !== 'true' || !verifySequence) {
          // Try one more time if verification failed
          await AsyncStorage.multiSet([
            ['unlockSequence', JSON.stringify(unlockSequence)],
            ['hasCompletedOnboarding', 'true'],
          ]);
        }

        // Navigate to main menu
        router.replace('/main-menu');
      } catch (error) {
        console.error('Failed to save onboarding data:', error);
        Alert.alert('Error', 'Failed to save unlock sequence. Please try again.');
      }
    }
  };

  const renderWelcomeStep = () => (
    <Card style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Image 
          source={require('../assets/images/icons/splash-icon-light.png')} 
          style={styles.splashIcon} 
          resizeMode="contain"
        />
      </View>
      <Text style={styles.headline}>My Calm Baby</Text>
      <Text style={styles.subText}>
        Soothing animations and gentle sounds to help your little one relax and sleep
      </Text>
      <PrimaryButton
        title="Get Started"
        onPress={() => setStep('explain-lock')}
      />
    </Card>
  );

  const renderExplainLockStep = () => (
    <Card style={styles.stepContainer}>
      <View style={styles.phoneOutline}>
        <View style={[styles.cornerDot, { top: 20, left: 20 }]}>
          <Text style={styles.cornerLabel}>TL</Text>
        </View>
        <View style={[styles.cornerDot, { top: 20, right: 20 }]}>
          <Text style={styles.cornerLabel}>TR</Text>
        </View>
        <View style={[styles.cornerDot, { bottom: 20, left: 20 }]}>
          <Text style={styles.cornerLabel}>BL</Text>
        </View>
        <View style={[styles.cornerDot, { bottom: 20, right: 20 }]}>
          <Text style={styles.cornerLabel}>BR</Text>
        </View>
      </View>
      <Text style={styles.headline}>Your secret unlock</Text>
      <Text style={styles.bodyText}>
        To keep your baby safe, you&apos;ll create a 4-corner tap sequence that only you know. 
        This prevents accidental exits during use.
      </Text>
      <PrimaryButton
        title="Set Up Sequence"
        onPress={() => setStep('setup-sequence')}
      />
    </Card>
  );

  const renderSetupSequenceStep = () => (
    <Card style={styles.stepContainer}>
      <SectionHeader title="Tap your four corners in order" />
      <Text style={styles.bodyText}>
        Choose a sequence you&apos;ll remember. You can change this later in settings.
      </Text>
      
      <View style={styles.sequenceContainer}>
        <View style={styles.phoneOutlineSetup}>
          {Object.entries(CORNER_POSITIONS).map(([corner, position]) => (
            <TouchableOpacity
              key={corner}
              style={[
                styles.cornerButton,
                position,
                tappedCorners.includes(corner as Corner) && styles.cornerButtonTapped
              ]}
              onPress={() => handleCornerTap(corner as Corner)}
            >
              <Text style={[styles.cornerButtonText, tappedCorners.includes(corner as Corner) && styles.cornerButtonTextActive]}>{corner}</Text>
              {tappedCorners.includes(corner as Corner) && (
                <Text style={styles.sequenceNumber}>
                  {tappedCorners.indexOf(corner as Corner) + 1}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Visual indicator dots - only show after first corner press */}
        {tappedCorners.length > 0 && (
          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View 
                key={index} 
                style={[
                  styles.sequenceDot,
                  tappedCorners.length > index && styles.activeDot,
                  showError && tappedCorners.length > index && styles.errorDot
                ]}
              />
            ))}
          </View>
        )}
        
        <View style={styles.sequenceDisplay}>
          <Text style={styles.sequenceText}>
            Sequence: {tappedCorners.join(' → ') || 'Tap corners above'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <SecondaryButton
          title="Reset"
          onPress={resetSequence}
          style={styles.resetButton}
        />
        <PrimaryButton
          title="Confirm Sequence"
          onPress={confirmSequence}
          disabled={unlockSequence.length !== 4}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 'welcome' && renderWelcomeStep()}
      {step === 'explain-lock' && renderExplainLockStep()}
      {step === 'setup-sequence' && renderSetupSequenceStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.md,
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: designTokens.spacing.sm,
  },
  title: {
    fontSize: designTokens.typography.sizes.lg,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.md,
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
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.aliceBlue,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: designTokens.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  headline: {
    fontSize: designTokens.typography.sizes.xl,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
    textAlign: 'center',
    marginBottom: designTokens.spacing.md,
  },
  subText: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xxl,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.charcoal,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xl,
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  phoneOutline: {
    width: 200,
    height: 300,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    marginBottom: 32,
    position: 'relative',
  },
  cornerDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
  sequenceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  splashIcon: {
    width: 120,
    height: 120,
  },
  phoneOutlineSetup: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: designTokens.colors.lightGray,
    borderRadius: 20,
    borderStyle: 'dashed',
    position: 'relative',
    marginBottom: 24,
  },
  cornerButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: designTokens.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerButtonTapped: {
    backgroundColor: designTokens.colors.primary,
    borderColor: designTokens.colors.primaryDark,
  },
  cornerButtonText: {
    color: designTokens.colors.charcoal,
    fontSize: 10,
    fontWeight: designTokens.typography.weights.semibold,
  },
  cornerButtonTextActive: {
    color: designTokens.colors.white,
    fontWeight: designTokens.typography.weights.bold,
  },
  sequenceNumber: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  sequenceDisplay: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sequenceText: {
    fontSize: 14,
    color: '#606060',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resetButtonText: {
    color: '#606060',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
