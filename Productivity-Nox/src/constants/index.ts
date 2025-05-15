export const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY: '#CCCCCC',
  LIGHT_GRAY: '#F5F5F5',
  DARK_GRAY: '#1A1A1A',
  RED: '#FF4444',
} as const;

export const SPACING = {
  XS: 5,
  SM: 10,
  MD: 15,
  LG: 20,
  XL: 25,
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
} as const;

export const FONT_WEIGHTS = {
  REGULAR: '400',
  MEDIUM: '500',
  SEMI_BOLD: '600',
  BOLD: '700',
} as const;

export const BORDER_RADIUS = {
  SM: 5,
  MD: 8,
  LG: 10,
  XL: 20,
  ROUND: 9999,
} as const;

export const SHADOWS = {
  SM: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

export const DEFAULT_NUTRITION_GOALS = {
  CALORIES: 2000,
  PROTEIN: 50,
  CARBS: 250,
  FATS: 70,
  WATER: 2000, // ml
} as const;

export const STORAGE_KEYS = {
  THEME: 'theme',
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
} as const; 