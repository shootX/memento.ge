export const DEMO_SLUG = 'demo';
export const DEMO_HOST_TOKEN = 'mock-token-abc';
export const DEMO_GUEST_KEY = 'demo-guest-key';

export function isDemoSlug(slug: string) {
  return slug === DEMO_SLUG;
}

export function isDemoHostToken(token: string) {
  return token === DEMO_HOST_TOKEN || token.startsWith('mock-');
}
