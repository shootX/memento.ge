import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type GuestState = {
  namesBySlug: Record<string, string>;
  setGuestName: (slug: string, name: string) => Promise<void>;
  getGuestKey: (slug: string) => Promise<string>;
};

export const useGuestStore = create<GuestState>(() => ({
  namesBySlug: {},

  async setGuestName(slug, name) {
    await AsyncStorage.setItem(`memento_guest_name_${slug}`, name);
  },

  async getGuestKey(slug) {
    const key = `memento_gk_${slug}`;
    const existing = await AsyncStorage.getItem(key);
    if (existing) return existing;
    const id = globalThis.crypto?.randomUUID?.() ?? `gk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(key, id);
    return id;
  },
}));
