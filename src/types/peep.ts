import type { BubbleThemeId } from '../theme/colors';

export const PEEP_STATUSES = [
  'available',
  'looking',
  'busy',
  'dnd',
] as const;

export type PeepStatus = (typeof PEEP_STATUSES)[number];

export const PEEP_STATUS_LABELS: Record<PeepStatus, string> = {
  available: 'Down to chat',
  looking: 'Just vibing',
  busy: 'In my zone',
  dnd: 'Do not disturb',
};

export const PEEP_STATUS_EMOJI: Record<PeepStatus, string> = {
  available: '💬',
  looking: '👀',
  busy: '🎧',
  dnd: '🌙',
};

export const AVATAR_EMOJIS = [
  '😎',
  '🦊',
  '👾',
  '🌟',
  '🔥',
  '💫',
  '🐱',
  '🚀',
  '🎮',
  '🦄',
  '🌈',
  '⚡',
] as const;

export const COSMETIC_BADGES = [
  {
    id: 'first_peep',
    label: 'First Peep',
    emoji: '✨',
    hint: 'Created your Peep',
  },
  {
    id: 'stylist',
    label: 'Stylist',
    emoji: '🎨',
    hint: 'Picked a bubble theme',
  },
  {
    id: 'expressive',
    label: 'Expressive',
    emoji: '😄',
    hint: 'Chose an avatar emoji',
  },
  {
    id: 'mood_master',
    label: 'Mood Master',
    emoji: '🎭',
    hint: 'Set your vibe status',
  },
] as const;

export type CosmeticBadgeId = (typeof COSMETIC_BADGES)[number]['id'];

export type PeepProfile = {
  name: string;
  age: number;
  /** Age is private by default — never shown on Discover cards. */
  agePrivate: boolean;
  status: PeepStatus;
  avatarEmoji: string;
  bubbleThemeId: BubbleThemeId | string;
  discoverable: boolean;
  /** Cosmetic only — no popularity ranking. */
  badges: CosmeticBadgeId[];
  blockedDeviceIds: string[];
  preferReducedMotion: boolean;
  updatedAt: string;
};

export function defaultProfileFields(): Pick<
  PeepProfile,
  | 'agePrivate'
  | 'avatarEmoji'
  | 'bubbleThemeId'
  | 'badges'
  | 'blockedDeviceIds'
  | 'preferReducedMotion'
  | 'discoverable'
> {
  return {
    agePrivate: true,
    avatarEmoji: '😎',
    bubbleThemeId: 'violet',
    badges: [],
    blockedDeviceIds: [],
    preferReducedMotion: false,
    discoverable: false,
  };
}
