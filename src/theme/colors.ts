/**
 * Peepzi Gen‑Z design tokens — electric, playful, premium (not childish).
 */
export const colors = {
  // Brand accents
  electricPurple: '#A855F7',
  electricPurpleDeep: '#7C3AED',
  cyan: '#22D3EE',
  cyanDeep: '#06B6D4',
  lime: '#A3E635',
  limeDeep: '#84CC16',
  coral: '#FB7185',
  coralDeep: '#F43F5E',
  lavender: '#E9D5FF',
  lavenderSoft: '#F3E8FF',

  // Surfaces
  background: '#F6F0FF',
  backgroundAlt: '#EEF9FF',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',
  surfaceMuted: '#F3E8FF',
  surfaceBorder: 'rgba(124, 58, 237, 0.14)',

  // Text
  textPrimary: '#1E1033',
  textSecondary: '#5B4B76',
  textMuted: '#8B7AA8',
  textInverse: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F43F5E',
  info: '#06B6D4',

  // Status
  statusAvailable: '#22C55E',
  statusLooking: '#06B6D4',
  statusBusy: '#F59E0B',
  statusDnd: '#F43F5E',

  // Shadows / glow
  shadow: 'rgba(88, 28, 135, 0.18)',
  glowPurple: 'rgba(168, 85, 247, 0.45)',
  glowCyan: 'rgba(34, 211, 238, 0.4)',

  // Camera stage
  cameraStage: '#1A1030',
  cameraStageSoft: '#2A1B4A',
} as const;

/** Customisable Peep bubble themes (cosmetic only). */
export const BUBBLE_THEMES = [
  { id: 'violet', label: 'Violet Pop', from: '#A855F7', to: '#EC4899' },
  { id: 'cyan', label: 'Cyber Cyan', from: '#22D3EE', to: '#6366F1' },
  { id: 'lime', label: 'Lime Rush', from: '#A3E635', to: '#22D3EE' },
  { id: 'coral', label: 'Coral Wave', from: '#FB7185', to: '#A855F7' },
  { id: 'sunset', label: 'Sunset', from: '#FB923C', to: '#EC4899' },
  { id: 'mint', label: 'Mint Glow', from: '#34D399', to: '#22D3EE' },
  { id: 'magenta', label: 'Magenta', from: '#E879F9', to: '#818CF8' },
  { id: 'sky', label: 'Sky High', from: '#38BDF8', to: '#A855F7' },
] as const;

export type BubbleThemeId = (typeof BUBBLE_THEMES)[number]['id'];

export function getBubbleTheme(id: string | undefined) {
  return BUBBLE_THEMES.find((t) => t.id === id) ?? BUBBLE_THEMES[0];
}

export type ColorName = keyof typeof colors;
