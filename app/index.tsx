import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debug } from './utils/debug';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Use multiGet for atomic read of related values
      const results = await AsyncStorage.multiGet(['hasCompletedOnboarding', 'unlockSequence']);
      const hasCompletedOnboarding = results[0][1];
      const unlockSequence = results[1][1];

      if (hasCompletedOnboarding === 'true') {
        // Check if unlock sequence exists
        if (!unlockSequence) {
          // Onboarding is complete but unlock sequence is missing
          // Redirect to setup sequence step
          router.replace('/onboarding?step=setup-sequence');
        } else {
          router.replace('/main-menu');
        }
      } else {
        // Only go to onboarding if explicitly not completed
        router.replace('/onboarding');
      }
    } catch (error) {
      debug('Failed to check onboarding status:', error);
      // Default to onboarding if storage read fails
      router.replace('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <View style={styles.container} />;
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
