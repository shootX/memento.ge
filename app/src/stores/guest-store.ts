import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DEMO_GUEST_KEY, isDemoSlug } from '@/src/lib/demo';

const memoryKeys: Record<string, string> = {};

export const guestStore = {
  async setGuestName(slug: string, name: string) {
    await AsyncStorage.setItem(`memento_guest_name_${slug}`, name);
  },

  async getGuestName(slug: string) {
    return AsyncStorage.getItem(`memento_guest_name_${slug}`);
  },

  async getGuestKey(slug: string): Promise<string> {
    if (isDemoSlug(slug) && (Platform.OS === 'web' || __DEV__)) {
      return DEMO_GUEST_KEY;
    }
    const key = `memento_gk_${slug}`;
    const existing = memoryKeys[slug] ?? (await AsyncStorage.getItem(key));
    if (existing) {
      memoryKeys[slug] = existing;
      return existing;
    }
    const id =
      globalThis.crypto?.randomUUID?.() ?? `gk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    memoryKeys[slug] = id;
    await AsyncStorage.setItem(key, id);
    return id;
  },
};
