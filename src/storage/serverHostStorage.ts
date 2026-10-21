import AsyncStorage from '@react-native-async-storage/async-storage';
import { DISCOVERY_DEFAULTS } from '../config/discovery';

const HOST_KEY = '@peepzi/serverHost/v1';

export async function loadServerHost(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(HOST_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    // fall through
  }
  return DISCOVERY_DEFAULTS.defaultServerHost;
}

export async function saveServerHost(host: string): Promise<void> {
  await AsyncStorage.setItem(HOST_KEY, host.trim());
}
