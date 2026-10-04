import type { AuthSession, MobileOAuthRequest } from '@/src/api/types';
import { ApiError } from '@/src/api/http';
import { oauthErrorCode, parseOAuthLinkRequired } from '@/src/auth/oauth-errors';
import type { MobileOAuthPendingLink } from '@/src/api/types';

export type OAuthExchangeResult =
  | { kind: 'session'; session: AuthSession }
  | { kind: 'pending_link'; pending: MobileOAuthPendingLink }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string; code?: string };

export function mapOAuthApiError(err: unknown): OAuthExchangeResult {
  const code = oauthErrorCode(err);
  if (err instanceof ApiError) {
    if (code === 'RATE_LIMITED') {
      return { kind: 'error', message: err.message, code: 'RATE_LIMITED' };
    }
    return { kind: 'error', message: err.message, code: code ?? undefined };
  }
  if (err instanceof Error) {
    if (err.message === 'oauth_cancelled') return { kind: 'cancelled' };
    return { kind: 'error', message: err.message };
  }
  return { kind: 'error', message: 'unknown' };
}

export type OAuthApiClient = {
  exchangeMobileOAuth: (body: MobileOAuthRequest) => Promise<AuthSession>;
  startOAuthLink: (pendingLinkId: string, email: string) => Promise<unknown>;
  verifyOAuthLink: (pendingLinkId: string, email: string, code: string) => Promise<AuthSession>;
};

export async function exchangeOAuthToken(
  client: OAuthApiClient,
  body: MobileOAuthRequest,
): Promise<OAuthExchangeResult> {
  try {
    const session = await client.exchangeMobileOAuth(body);
    return { kind: 'session', session };
  } catch (err) {
    const pending = parseOAuthLinkRequired(err);
    if (pending) return { kind: 'pending_link', pending };
    return mapOAuthApiError(err);
  }
}

export async function completePendingOAuthLink(
  client: OAuthApiClient,
  pendingLinkId: string,
  email: string,
  code: string,
): Promise<OAuthExchangeResult> {
  try {
    const session = await client.verifyOAuthLink(pendingLinkId, email.trim(), code.trim());
    return { kind: 'session', session };
  } catch (err) {
    return mapOAuthApiError(err);
  }
}
