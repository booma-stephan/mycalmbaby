import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from './styles/designTokens';
import { PrimaryButton, SecondaryButton, Card } from './components/UIComponents';
import { isGuidedAccessEnabled, addGuidedAccessListener, startListening, stopListening } from '../modules/expo-guided-access';

type SetupStep = 'intro' | 'step1' | 'step2' | 'step3' | 'step4' | 'complete';

const SETUP_STEPS = [
  {
    id: 'step1',
    title: 'Open Settings',
    instruction: 'Open the Settings app on your iPhone or iPad',
    detail: 'Tap the button below to go directly to Settings, or find the Settings app on your home screen.',
    icon: 'settings-outline' as const,
  },
  {
    id: 'step2',
    title: 'Go to Accessibility',
    instruction: 'Navigate to Accessibility settings',
    detail: 'In Settings, scroll down and tap "Accessibility".',
    icon: 'accessibility-outline' as const,
  },
  {
    id: 'step3',
    title: 'Find Guided Access',
    instruction: 'Scroll down and tap "Guided Access"',
    detail: 'Under the "General" section at the bottom of Accessibility, tap "Guided Access".',
    icon: 'lock-closed-outline' as const,
  },
  {
    id: 'step4',
    title: 'Enable Guided Access',
    instruction: 'Turn on Guided Access and set a passcode',
    detail: 'Toggle "Guided Access" ON. Tap "Passcode Settings" to set a passcode that you\'ll use to exit Guided Access mode.',
    icon: 'key-outline' as const,
  },
];

export default function KioskSetupScreen() {
  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [guidedAccessActive, setGuidedAccessActive] = useState(false);

  useEffect(() => {
    // Check initial Guided Access status
    setGuidedAccessActive(isGuidedAccessEnabled());

    // Start listening for changes
    startListening();
    const subscription = addGuidedAccessListener((event) => {
      setGuidedAccessActive(event.isEnabled);
    });

    return () => {
      subscription.remove();
      stopListening();
    };
  }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    }
  };

  const openAccessibilitySettings = () => {
    if (Platform.OS === 'ios') {
      // Deep link to Accessibility settings
      Linking.openURL('App-prefs:ACCESSIBILITY');
    }
  };

  const getStepIndex = (): number => {
    const stepIds = ['step1', 'step2', 'step3', 'step4'];
    return stepIds.indexOf(currentStep);
  };

  const goToNextStep = () => {
    const steps: SetupStep[] = ['intro', 'step1', 'step2', 'step3', 'step4', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const steps: SetupStep[] = ['intro', 'step1', 'step2', 'step3', 'step4', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const startBabyMode = () => {
    router.push('/baby-mode');
  };

  const goBack = () => {
    router.back();
  };

  const renderIntro = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={80} color={designTokens.colors.primary} />
      </View>
      <Text style={styles.title}>Kiosk Mode Setup</Text>
      <Text style={styles.subtitle}>
        Prevent your baby from accidentally exiting the app using iOS Guided Access
      </Text>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={24} color={designTokens.colors.primary} />
          <Text style={styles.infoText}>
            Guided Access is a built-in iOS feature that locks your device to a single app.
            When enabled, your baby won&apos;t be able to exit My Calm Baby or access other apps.
          </Text>
        </View>
      </Card>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Guided Access Status:</Text>
          <View style={[
            styles.statusBadge,
            guidedAccessActive ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={[
              styles.statusText,
              guidedAccessActive ? styles.statusTextActive : styles.statusTextInactive
            ]}>
              {guidedAccessActive ? 'Active' : 'Not Active'}
            </Text>
          </View>
        </View>
      </Card>

      {guidedAccessActive ? (
        <View style={styles.readyContainer}>
          <Ionicons name="checkmark-circle" size={48} color={designTokens.colors.success} />
          <Text style={styles.readyText}>Guided Access is already enabled!</Text>
          <Text style={styles.readySubtext}>
            You can start Baby Mode now. Triple-click the side button to activate Guided Access.
          </Text>
        </View>
      ) : (
        <Text style={styles.instructionPreview}>
          Follow the setup steps to enable Guided Access on your device.
        </Text>
      )}
    </View>
  );

  const renderStep = () => {
    const stepIndex = getStepIndex();
    if (stepIndex < 0) return null;

    const step = SETUP_STEPS[stepIndex];

    return (
      <View style={styles.stepContent}>
        <View style={styles.progressContainer}>
          {SETUP_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= stepIndex ? styles.progressDotActive : styles.progressDotInactive
              ]}
            />
          ))}
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name={step.icon} size={64} color={designTokens.colors.primary} />
        </View>

        <Text style={styles.stepNumber}>Step {stepIndex + 1} of {SETUP_STEPS.length}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.instruction}>{step.instruction}</Text>
        <Text style={styles.detail}>{step.detail}</Text>

        {stepIndex === 0 && (
          <SecondaryButton
            title="Open Settings"
            onPress={openSettings}
            style={styles.actionButton}
          />
        )}

        {stepIndex === 1 && (
          <SecondaryButton
            title="Open Accessibility Settings"
            onPress={openAccessibilitySettings}
            style={styles.actionButton}
          />
        )}

        <Card style={StyleSheet.flatten([styles.statusCard, { marginTop: designTokens.spacing.lg }])}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <View style={[
              styles.statusBadge,
              guidedAccessActive ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                guidedAccessActive ? styles.statusTextActive : styles.statusTextInactive
              ]}>
                {guidedAccessActive ? 'Enabled' : 'Not Enabled'}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderComplete = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={guidedAccessActive ? "checkmark-circle" : "alert-circle"}
          size={80}
          color={guidedAccessActive ? designTokens.colors.success : designTokens.colors.warning}
        />
      </View>

      {guidedAccessActive ? (
        <>
          <Text style={styles.title}>Setup Complete!</Text>
          <Text style={styles.subtitle}>
            Guided Access is now enabled on your device.
          </Text>

          <Card style={styles.howToCard}>
            <Text style={styles.howToTitle}>How to use Kiosk Mode:</Text>
            <View style={styles.howToStep}>
              <Text style={styles.howToNumber}>1.</Text>
              <Text style={styles.howToText}>Start Baby Mode from the main menu</Text>
            </View>
            <View style={styles.howToStep}>
              <Text style={styles.howToNumber}>2.</Text>
              <Text style={styles.howToText}>Triple-click the side button to activate Guided Access</Text>
            </View>
            <View style={styles.howToStep}>
              <Text style={styles.howToNumber}>3.</Text>
              <Text style={styles.howToText}>Tap &quot;Start&quot; in the Guided Access menu</Text>
            </View>
            <View style={styles.howToStep}>
              <Text style={styles.howToNumber}>4.</Text>
              <Text style={styles.howToText}>To exit, triple-click and enter your passcode</Text>
            </View>
          </Card>
        </>
      ) : (
        <>
          <Text style={styles.title}>Almost There!</Text>
          <Text style={styles.subtitle}>
            Guided Access doesn&apos;t seem to be enabled yet. Please complete the setup steps,
            or you can still use Baby Mode with the triple-click reminder.
          </Text>

          <SecondaryButton
            title="Retry Setup"
            onPress={() => setCurrentStep('step1')}
            style={styles.retryButton}
          />
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SecondaryButton
          title="Back"
          onPress={goBack}
          style={styles.backButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'intro' && renderIntro()}
        {currentStep.startsWith('step') && renderStep()}
        {currentStep === 'complete' && renderComplete()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep === 'intro' && (
          <>
            {guidedAccessActive ? (
              <PrimaryButton
                title="Start Baby Mode"
                onPress={startBabyMode}
              />
            ) : (
              <PrimaryButton
                title="Begin Setup"
                onPress={goToNextStep}
              />
            )}
          </>
        )}

        {currentStep.startsWith('step') && (
          <View style={styles.navButtons}>
            <SecondaryButton
              title="Previous"
              onPress={goToPrevStep}
              style={styles.navButton}
            />
            <PrimaryButton
              title={getStepIndex() === SETUP_STEPS.length - 1 ? 'Finish' : 'Next'}
              onPress={goToNextStep}
              style={styles.navButton}
            />
          </View>
        )}

        {currentStep === 'complete' && (
          <PrimaryButton
            title="Start Baby Mode"
            onPress={startBabyMode}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.aliceBlue,
  },
  header: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: designTokens.spacing.md,
    minHeight: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xl,
  },
  stepContent: {
    alignItems: 'center',
    paddingTop: designTokens.spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.xl,
    gap: designTokens.spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    backgroundColor: designTokens.colors.primary,
  },
  progressDotInactive: {
    backgroundColor: designTokens.colors.mediumGray,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: designTokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.md,
  },
  stepNumber: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.darkGray,
    marginBottom: designTokens.spacing.xs,
  },
  title: {
    fontSize: designTokens.typography.sizes.xl,
    fontWeight: designTokens.typography.weights.bold,
    color: designTokens.colors.charcoal,
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  subtitle: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.md,
  },
  instruction: {
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  detail: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: designTokens.spacing.md,
  },
  instructionPreview: {
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    textAlign: 'center',
    marginTop: designTokens.spacing.md,
  },
  infoCard: {
    width: '100%',
    marginBottom: designTokens.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.darkGray,
    lineHeight: 20,
  },
  statusCard: {
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: designTokens.typography.sizes.base,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.charcoal,
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.xl,
  },
  statusActive: {
    backgroundColor: designTokens.colors.calmGreen,
  },
  statusInactive: {
    backgroundColor: designTokens.colors.lightGray,
  },
  statusText: {
    fontSize: designTokens.typography.sizes.sm,
    fontWeight: designTokens.typography.weights.semibold,
  },
  statusTextActive: {
    color: designTokens.colors.charcoal,
  },
  statusTextInactive: {
    color: designTokens.colors.darkGray,
  },
  readyContainer: {
    alignItems: 'center',
    marginTop: designTokens.spacing.lg,
  },
  readyText: {
    fontSize: designTokens.typography.sizes.md,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.success,
    marginTop: designTokens.spacing.sm,
  },
  readySubtext: {
    fontSize: designTokens.typography.sizes.sm,
    color: designTokens.colors.darkGray,
    textAlign: 'center',
    marginTop: designTokens.spacing.xs,
  },
  actionButton: {
    marginTop: designTokens.spacing.lg,
    minWidth: 200,
  },
  howToCard: {
    width: '100%',
    marginTop: designTokens.spacing.lg,
  },
  howToTitle: {
    fontSize: designTokens.typography.sizes.base,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.charcoal,
    marginBottom: designTokens.spacing.md,
  },
  howToStep: {
    flexDirection: 'row',
    marginBottom: designTokens.spacing.sm,
  },
  howToNumber: {
    fontSize: designTokens.typography.sizes.base,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.primary,
    width: 24,
  },
  howToText: {
    flex: 1,
    fontSize: designTokens.typography.sizes.base,
    color: designTokens.colors.darkGray,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: designTokens.spacing.lg,
    minWidth: 150,
  },
  footer: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.aliceBlue,
  },
  navButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
  },
  navButton: {
    flex: 1,
  },
});
