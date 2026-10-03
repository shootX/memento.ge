import { parseEventSlugFromUrl, parseMagicLinkToken } from '@/src/lib/slug';

export type DeepLinkAction =
  | { type: 'auth'; token: string }
  | { type: 'guest'; slug: string }
  | { type: 'ignore' };

export function resolveDeepLink(url: string): DeepLinkAction {
  const authToken = parseMagicLinkToken(url);
  if (authToken) return { type: 'auth', token: authToken };

  const slug = parseEventSlugFromUrl(url);
  if (slug) return { type: 'guest', slug };

  return { type: 'ignore' };
}
