/**
 * Peepzi light theme — clean surfaces with soft purple/blue accents.
 */
export const colors = {
  background: '#F7F8FC',
  backgroundElevated: '#FFFFFF',
  backgroundMuted: '#EEF0F7',
  surface: '#FFFFFF',
  surfaceBorder: '#E2E5F0',

  textPrimary: '#1A1B2E',
  textSecondary: '#5C6078',
  textMuted: '#8B90A8',
  textInverse: '#FFFFFF',

  purple: '#7C5CFC',
  purpleSoft: '#9B85FF',
  purpleDeep: '#5B3FD4',
  blue: '#3B82F6',
  blueSoft: '#60A5FA',
  blueDeep: '#2563EB',

  accentGradientStart: '#7C5CFC',
  accentGradientEnd: '#3B82F6',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  offline: '#8B90A8',

  statusAvailable: '#10B981',
  statusLooking: '#3B82F6',
  statusBusy: '#F59E0B',
  statusDnd: '#EF4444',

  cameraPlaceholder: '#E8EBF5',
  bubbleFill: '#FFFFFF',
  bubbleBorder: '#D8DCEB',
  bubbleShadow: 'rgba(28, 30, 60, 0.12)',
  headFill: '#E4E7F4',
} as const;

export type ColorName = keyof typeof colors;
