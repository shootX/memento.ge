import { ApiError } from '@/src/api/http';
import type { MobileOAuthPendingLink } from '@/src/api/types';

export function parseOAuthLinkRequired(err: unknown): MobileOAuthPendingLink | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  const body = err.body as { code?: string; pendingLinkId?: string } | undefined;
  if (body?.code === 'OAUTH_LINK_REQUIRED' && typeof body.pendingLinkId === 'string') {
    return { pendingLinkId: body.pendingLinkId };
  }
  return null;
}

export function oauthErrorCode(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const body = err.body as { code?: string } | undefined;
  return typeof body?.code === 'string' ? body.code : null;
}
