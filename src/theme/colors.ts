/**
 * Peepzi dark theme — purple + blue accents (product direction for v0.1).
 */
export const colors = {
  background: '#0B0B12',
  backgroundElevated: '#14141F',
  backgroundMuted: '#1A1A2A',
  surface: '#1E1E30',
  surfaceBorder: '#2A2A42',

  textPrimary: '#F4F4FA',
  textSecondary: '#A8A8C0',
  textMuted: '#6E6E8A',
  textInverse: '#0B0B12',

  purple: '#8B5CF6',
  purpleSoft: '#A78BFA',
  purpleDeep: '#6D28D9',
  blue: '#3B82F6',
  blueSoft: '#60A5FA',
  blueDeep: '#2563EB',

  accentGradientStart: '#8B5CF6',
  accentGradientEnd: '#3B82F6',

  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  offline: '#6E6E8A',

  statusAvailable: '#34D399',
  statusLooking: '#60A5FA',
  statusBusy: '#FBBF24',
  statusDnd: '#F87171',

  cameraPlaceholder: '#12121C',
  bubbleGlow: 'rgba(139, 92, 246, 0.35)',
} as const;

export type ColorName = keyof typeof colors;
