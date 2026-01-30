/**
 * Debug utilities
 * Provides conditional logging that only runs in development mode
 */

// Check if we're in development mode
const isDev = __DEV__;

/**
 * Debug log function that only logs in development mode
 * @param args - Arguments to log
 */
export const debug = isDev
  ? (...args: unknown[]) => console.log(...args)
  : () => {};

/**
 * Debug warn function that only warns in development mode
 * @param args - Arguments to log
 */
export const debugWarn = isDev
  ? (...args: unknown[]) => console.warn(...args)
  : () => {};

/**
 * Debug error function - always logs errors but with additional context in dev
 * @param args - Arguments to log
 */
export const debugError = (...args: unknown[]) => {
  if (isDev) {
    console.error('[DEBUG]', ...args);
  } else {
    // In production, still log errors but without debug prefix
    console.error(...args);
  }
};
