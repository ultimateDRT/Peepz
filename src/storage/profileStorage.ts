import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PeepProfile } from '../types/peep';

const PROFILE_KEY = '@peepzi/profile/v1';

export async function loadProfile(): Promise<PeepProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PeepProfile;
    if (
      typeof parsed?.name !== 'string' ||
      typeof parsed?.age !== 'number' ||
      typeof parsed?.status !== 'string'
    ) {
      return null;
    }
    return {
      ...parsed,
      discoverable: Boolean(parsed.discoverable),
    };
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
