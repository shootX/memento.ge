import type { MobileOAuthRequest } from '@/src/api/types';

/** Request body sent to `POST /api/auth/mobile/oauth` (memento.ge contract). */
export function serializeMobileOAuthBody(body: MobileOAuthRequest): Record<string, string> {
  if (body.provider === 'facebook') {
    if (!body.accessToken) throw new Error('missing accessToken');
    return { provider: 'facebook', accessToken: body.accessToken };
  }
  if (!body.idToken) throw new Error('missing idToken');
  return { provider: body.provider, idToken: body.idToken };
}
