/**
 * Application constants
 * Centralized constants to avoid duplicate definitions across files
 */

// Gesture detection thresholds
export const SWIPE_THRESHOLD = 15; // pixels - threshold for detecting swipes

// Timing constants
export const FEEDBACK_DURATION = 1000; // ms - duration for feedback indicators
export const SEQUENCE_TIMEOUT = 3000; // ms - timeout for unlock sequence entry

// Animation durations
export const ANIMATION_DURATIONS = {
  FADE: 2000,
  ROTATION: 8000,
  SCALE: 3000,
  SHORT: 200,
  MEDIUM: 500,
  LONG: 1000,
} as const;

// Physics constants for basic-shapes animation
export const PHYSICS = {
  GRAVITY: 0.05,
  AIR_RESISTANCE: 0.98,
  BOUNCE_FACTOR: 0.4,
  MAX_VELOCITY: 8,
  MIN_BOUNDARY: 50,
} as const;

// Corner size for touch zones (parental lock)
export const CORNER_SIZE_RATIO = 0.25; // 25% of smaller screen dimension
export const CORNER_SIZE_MIN = 120; // minimum corner size in pixels
