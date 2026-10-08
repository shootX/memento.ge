import {
  parseEventSlugFromUrl,
  parseMagicLinkToken,
  parsePayCompleteDeepLink,
} from '@/src/lib/slug';

export type DeepLinkAction =
  | { type: 'auth'; token: string }
  | { type: 'guest'; slug: string }
  | { type: 'payComplete'; hostToken: string; paymentId?: string }
  | { type: 'ignore' };

export function resolveDeepLink(url: string): DeepLinkAction {
  const authToken = parseMagicLinkToken(url);
  if (authToken) return { type: 'auth', token: authToken };

  const pay = parsePayCompleteDeepLink(url);
  if (pay) return { type: 'payComplete', hostToken: pay.hostToken, paymentId: pay.paymentId };

  const slug = parseEventSlugFromUrl(url);
  if (slug) return { type: 'guest', slug };

  return { type: 'ignore' };
}
