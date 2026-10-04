import type { AuthSession, MobileOAuthPendingLink, MobileOAuthRequest } from '@/src/api/types';
import { ApiError } from '@/src/api/http';

export type OAuthExchangeResult =
  | { kind: 'session'; session: AuthSession }
  | { kind: 'pending_link'; pending: MobileOAuthPendingLink }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

export function isPendingLinkResponse(
  data: unknown,
): data is MobileOAuthPendingLink {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as MobileOAuthPendingLink).status === 'pending_link' &&
    typeof (data as MobileOAuthPendingLink).pendingLinkId === 'string'
  );
}

export function mapOAuthApiError(err: unknown): OAuthExchangeResult {
  if (err instanceof ApiError) {
    return { kind: 'error', message: err.message };
  }
  if (err instanceof Error) {
    if (err.message === 'oauth_cancelled') return { kind: 'cancelled' };
    return { kind: 'error', message: err.message };
  }
  return { kind: 'error', message: 'unknown' };
}

export type OAuthApiClient = {
  exchangeMobileOAuth: (body: MobileOAuthRequest) => Promise<AuthSession | MobileOAuthPendingLink>;
  sendOAuthLinkEmail: (pendingLinkId: string, email: string) => Promise<unknown>;
  verifyOAuthLink: (pendingLinkId: string, email: string, code: string) => Promise<AuthSession>;
};

export async function exchangeOAuthToken(
  client: OAuthApiClient,
  body: MobileOAuthRequest,
): Promise<OAuthExchangeResult> {
  try {
    const res = await client.exchangeMobileOAuth(body);
    if (isPendingLinkResponse(res)) {
      return { kind: 'pending_link', pending: res };
    }
    return { kind: 'session', session: res };
  } catch (err) {
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
