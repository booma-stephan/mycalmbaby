import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import { Platform } from 'react-native';

// Define subscription type
type EventSubscription = {
  remove: () => void;
};

// Define the native module interface
interface ExpoGuidedAccessModuleInterface {
  isGuidedAccessEnabled(): boolean;
  checkGuidedAccessStatus(): Promise<{ isEnabled: boolean; platform: string }>;
  startListening(): void;
  stopListening(): void;
}

// Get the native module (iOS only)
let ExpoGuidedAccess: ExpoGuidedAccessModuleInterface | null = null;
let emitter: InstanceType<typeof EventEmitter> | null = null;

if (Platform.OS === 'ios') {
  try {
    ExpoGuidedAccess = requireNativeModule<ExpoGuidedAccessModuleInterface>('ExpoGuidedAccess');
    emitter = new EventEmitter(ExpoGuidedAccess as any);
  } catch {
    // Module not available - running in Expo Go or web
    ExpoGuidedAccess = null;
    emitter = null;
  }
}

/**
 * Check if Guided Access is currently enabled (synchronous)
 * @returns boolean - true if Guided Access is enabled, false otherwise
 * @note Always returns false on non-iOS platforms
 */
export function isGuidedAccessEnabled(): boolean {
  if (Platform.OS !== 'ios' || !ExpoGuidedAccess) {
    return false;
  }
  try {
    return ExpoGuidedAccess.isGuidedAccessEnabled();
  } catch {
    return false;
  }
}

/**
 * Check Guided Access status asynchronously
 * @returns Promise with status object containing isEnabled and platform
 */
export async function checkGuidedAccessStatus(): Promise<{ isEnabled: boolean; platform: string }> {
  if (Platform.OS !== 'ios' || !ExpoGuidedAccess) {
    return { isEnabled: false, platform: Platform.OS };
  }
  try {
    return await ExpoGuidedAccess.checkGuidedAccessStatus();
  } catch {
    return { isEnabled: false, platform: Platform.OS };
  }
}

/**
 * Start listening for Guided Access status changes
 * Use addGuidedAccessListener to receive events
 */
export function startListening(): void {
  if (Platform.OS === 'ios' && ExpoGuidedAccess) {
    try {
      ExpoGuidedAccess.startListening();
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Stop listening for Guided Access status changes
 */
export function stopListening(): void {
  if (Platform.OS === 'ios' && ExpoGuidedAccess) {
    try {
      ExpoGuidedAccess.stopListening();
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Add a listener for Guided Access status changes
 * @param callback - Function called when GA status changes
 * @returns Subscription object with remove() method
 */
export function addGuidedAccessListener(
  callback: (event: { isEnabled: boolean }) => void
): EventSubscription {
  if (!emitter) {
    // Return a no-op subscription for non-iOS or when module not available
    return {
      remove: () => {},
    };
  }

  return emitter.addListener('onGuidedAccessStatusChange', callback);
}

export default {
  isGuidedAccessEnabled,
  checkGuidedAccessStatus,
  startListening,
  stopListening,
  addGuidedAccessListener,
};
