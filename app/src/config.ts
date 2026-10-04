const DEFAULT_API_URL = 'https://qr.socialsave.cc';

export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, ''),
  /** In-memory API fixtures — off by default; set EXPO_PUBLIC_API_MOCK=true for local demo. */
  useMockApi: process.env.EXPO_PUBLIC_API_MOCK === 'true',
  deepLinkHost: 'memento.ge',
  authRedirectUri: 'memento://auth/callback',
  /** Screenshot/dev builds set EXPO_PUBLIC_INCLUDE_PREVIEW=true */
  includePreviewRoutes: process.env.EXPO_PUBLIC_INCLUDE_PREVIEW === 'true',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
};

export const PLAN_TIERS = {
  starter: { id: 'starter', nameKa: 'სტარტერი', priceGel: 49, maxUploads: 200 },
  classic: { id: 'classic', nameKa: 'კლასიკი', priceGel: 99, maxUploads: 600 },
  premium: { id: 'premium', nameKa: 'პრემიუმ', priceGel: 149, maxUploads: 1500 },
} as const;

export type PlanTierId = keyof typeof PLAN_TIERS;
