import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultProfileFields,
  PEEP_STATUSES,
  type CosmeticBadgeId,
  type PeepProfile,
  type PeepStatus,
} from '../types/peep';

const PROFILE_KEY = '@peepzi/profile/v1';

function isStatus(value: unknown): value is PeepStatus {
  return (
    typeof value === 'string' &&
    (PEEP_STATUSES as readonly string[]).includes(value)
  );
}

/** Migrate older v0.1 profiles into the richer Peep shape. */
export function normalizeProfile(raw: unknown): PeepProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as Partial<PeepProfile> & { name?: unknown; age?: unknown };
  if (typeof parsed.name !== 'string' || typeof parsed.age !== 'number') {
    return null;
  }
  if (!isStatus(parsed.status)) return null;

  const defaults = defaultProfileFields();
  const badges = Array.isArray(parsed.badges)
    ? (parsed.badges.filter((b) => typeof b === 'string') as CosmeticBadgeId[])
    : defaults.badges;
  const blockedDeviceIds = Array.isArray(parsed.blockedDeviceIds)
    ? parsed.blockedDeviceIds.filter((id) => typeof id === 'string')
    : defaults.blockedDeviceIds;

  return {
    name: parsed.name.trim().slice(0, 32),
    age: parsed.age,
    agePrivate: parsed.agePrivate != null ? Boolean(parsed.agePrivate) : true,
    status: parsed.status,
    avatarEmoji:
      typeof parsed.avatarEmoji === 'string' && parsed.avatarEmoji
        ? parsed.avatarEmoji
        : defaults.avatarEmoji,
    bubbleThemeId:
      typeof parsed.bubbleThemeId === 'string' && parsed.bubbleThemeId
        ? parsed.bubbleThemeId
        : defaults.bubbleThemeId,
    discoverable: Boolean(parsed.discoverable),
    badges,
    blockedDeviceIds,
    preferReducedMotion: Boolean(parsed.preferReducedMotion),
    updatedAt:
      typeof parsed.updatedAt === 'string'
        ? parsed.updatedAt
        : new Date().toISOString(),
  };
}

export async function loadProfile(): Promise<PeepProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveProfile(profile: PeepProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
