const DEFAULT_API_URL = 'https://qr.socialsave.cc';

export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, ''),
  useMockApi: process.env.EXPO_PUBLIC_API_MOCK === 'true',
  deepLinkHost: 'memento.ge',
};

export const PLAN_TIERS = {
  starter: { id: 'starter', nameKa: 'სტარტერი', priceGel: 49, maxUploads: 200 },
  classic: { id: 'classic', nameKa: 'კლასიკი', priceGel: 99, maxUploads: 600 },
  premium: { id: 'premium', nameKa: 'პრემიუმ', priceGel: 149, maxUploads: 1500 },
} as const;

export type PlanTierId = keyof typeof PLAN_TIERS;
