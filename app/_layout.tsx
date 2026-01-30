import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AudioManager from './utils/AudioManager';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const initAudio = async () => {
      // Only initialize the AudioManager, don't start white noise
      await AudioManager.initialize();
    };

    initAudio();

    return () => {
      AudioManager.cleanup();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="main-menu" />
        <Stack.Screen
          name="animation"
          options={{
            gestureEnabled: false, // Disable iOS back swipe gesture
            animation: 'none', // Optional: disable transition animations
          }}
        />
        <Stack.Screen name="kiosk-setup" />
        <Stack.Screen
          name="baby-mode"
          options={{
            gestureEnabled: false, // Disable iOS back swipe gesture
            animation: 'none',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="#FFFFFF" />
    </GestureHandlerRootView>
  );
}
