import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const TOKEN_KEY = 'memento_access_token';
const EMAIL_KEY = 'memento_user_email';

type AuthState = {
  accessToken: string | null;
  email: string | null;
  hydrated: boolean;
  setSession: (token: string, email: string) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  email: null,
  hydrated: false,

  async setSession(token, email) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(EMAIL_KEY, email);
    set({ accessToken: token, email });
  },

  async clearSession() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    set({ accessToken: null, email: null });
  },

  async hydrate() {
    const [token, email] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(EMAIL_KEY),
    ]);
    set({ accessToken: token, email, hydrated: true });
  },
}));
