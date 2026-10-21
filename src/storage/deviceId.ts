import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@peepzi/deviceId/v1';

function randomUuidV4(): string {
  // Persistent random id — not hardware-based
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing && existing.length >= 32) return existing;
  const id = randomUuidV4();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
