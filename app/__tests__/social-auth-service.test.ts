jest.mock('@/src/config', () => ({
  config: {
    apiUrl: 'https://test.example',
    useMockApi: false,
    deepLinkHost: 'memento.ge',
    authRedirectUri: 'memento://auth/callback',
  },
}));

import { ApiError } from '@/src/api/http';
import type { AuthSession, MobileOAuthRequest } from '@/src/api/types';
import { parseOAuthLinkRequired } from '@/src/auth/oauth-errors';
import {
  completePendingOAuthLink,
  exchangeOAuthToken,
  mapOAuthApiError,
} from '@/src/auth/social-auth-service';

const session: AuthSession = {
  accessToken: 'tok-1',
  expiresIn: 3600,
  user: { id: 'u1', email: 'a@b.c' },
};

function mockClient(overrides: Partial<{
  exchangeMobileOAuth: (body: MobileOAuthRequest) => Promise<AuthSession>;
  startOAuthLink: (pendingLinkId: string, email: string) => Promise<void>;
  verifyOAuthLink: (pendingLinkId: string, email: string, code: string) => Promise<AuthSession>;
}>) {
  return {
    exchangeMobileOAuth: jest.fn(),
    startOAuthLink: jest.fn(),
    verifyOAuthLink: jest.fn(),
    ...overrides,
  };
}

describe('parseOAuthLinkRequired', () => {
  it('reads 409 OAUTH_LINK_REQUIRED', () => {
    const err = new ApiError('conflict', 409, {
      code: 'OAUTH_LINK_REQUIRED',
      pendingLinkId: 'pl-1',
    });
    expect(parseOAuthLinkRequired(err)).toEqual({ pendingLinkId: 'pl-1' });
  });
});

describe('exchangeOAuthToken', () => {
  it('returns session on success', async () => {
    const client = mockClient({
      exchangeMobileOAuth: async () => session,
    });
    const result = await exchangeOAuthToken(client, {
      provider: 'google',
      idToken: 'jwt',
    });
    expect(result).toEqual({ kind: 'session', session });
  });

  it('returns pending_link on 409 OAUTH_LINK_REQUIRED', async () => {
    const client = mockClient({
      exchangeMobileOAuth: async () => {
        throw new ApiError('conflict', 409, {
          code: 'OAUTH_LINK_REQUIRED',
          pendingLinkId: 'pl-99',
        });
      },
    });
    const result = await exchangeOAuthToken(client, {
      provider: 'facebook',
      accessToken: 'fb',
    });
    expect(result).toEqual({ kind: 'pending_link', pending: { pendingLinkId: 'pl-99' } });
  });

  it('maps 400 invalid token', async () => {
    const client = mockClient({
      exchangeMobileOAuth: async () => {
        throw new ApiError('invalid id token', 400);
      },
    });
    const result = await exchangeOAuthToken(client, { provider: 'apple', idToken: 'x' });
    expect(result).toEqual({ kind: 'error', message: 'invalid id token' });
  });
});

describe('mapOAuthApiError', () => {
  it('maps oauth_cancelled to cancelled', () => {
    expect(mapOAuthApiError(new Error('oauth_cancelled'))).toEqual({ kind: 'cancelled' });
  });

  it('maps RATE_LIMITED code', () => {
    const err = new ApiError('too many', 429, { code: 'RATE_LIMITED' });
    expect(mapOAuthApiError(err)).toEqual({
      kind: 'error',
      message: 'too many',
      code: 'RATE_LIMITED',
    });
  });
});

describe('completePendingOAuthLink', () => {
  it('returns session after verify', async () => {
    const client = mockClient({
      verifyOAuthLink: async () => session,
    });
    const result = await completePendingOAuthLink(client, 'pl-99', 'a@b.c', '123456');
    expect(result).toEqual({ kind: 'session', session });
  });

  it('returns error on invalid code', async () => {
    const client = mockClient({
      verifyOAuthLink: async () => {
        throw new ApiError('invalid code', 400);
      },
    });
    const result = await completePendingOAuthLink(client, 'pl-99', 'a@b.c', '000000');
    expect(result.kind).toBe('error');
  });
});
