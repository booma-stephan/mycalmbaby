/**
 * Design System Tokens
 * Based on the wellness/meditation app design system
 */

// Design tokens object with all design system values
export const designTokens = {
  colors: {
    // Primary Colors
    primary: '#4A90E2',
    primaryLight: '#6BA6FF',
    primaryDark: '#357ABD',
    
    // Secondary Blues
    skyBlue: '#87CEEB',
    powderBlue: '#B0E0E6',
    aliceBlue: '#F0F8FF',
    
    // Neutrals
    white: '#FFFFFF',
    offWhite: '#FAFAFA',
    lightGray: '#F5F5F5',
    mediumGray: '#E0E0E0',
    darkGray: '#757575',
    charcoal: '#424242',
    
    // Accent Colors
    happyYellow: '#FFD700',
    calmGreen: '#90EE90',
    stressOrange: '#FFA500',
    anxietyRed: '#FF6B6B',
    peacefulPurple: '#DDA0DD',
    energyPink: '#FF69B4',
    
    // Semantic Colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      md: 20,
      lg: 24,
      xl: 28,
    },
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 50,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#4A90E2',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  
  gradients: {
    primary: ['#4A90E2', '#6BA6FF'],
    calm: ['#87CEEB', '#B0E0E6'],
    warm: ['#FFD700', '#FFA500'],
  },
} as const;

export type DesignTokens = typeof designTokens;
