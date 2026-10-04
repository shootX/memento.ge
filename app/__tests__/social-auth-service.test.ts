jest.mock('@/src/config', () => ({
  config: {
    apiUrl: 'https://test.example',
    useMockApi: false,
    deepLinkHost: 'memento.ge',
    authRedirectUri: 'memento://auth/callback',
  },
}));

import { ApiError } from '@/src/api/http';
import type { AuthSession, MobileOAuthPendingLink, MobileOAuthRequest } from '@/src/api/types';
import {
  completePendingOAuthLink,
  exchangeOAuthToken,
  isPendingLinkResponse,
  mapOAuthApiError,
} from '@/src/auth/social-auth-service';

const session: AuthSession = {
  accessToken: 'tok-1',
  expiresIn: 3600,
  user: { id: 'u1', email: 'a@b.c' },
};

const pending: MobileOAuthPendingLink = {
  status: 'pending_link',
  pendingLinkId: 'pl-99',
  email: null,
};

function mockClient(overrides: Partial<{
  exchangeMobileOAuth: (body: MobileOAuthRequest) => Promise<AuthSession | MobileOAuthPendingLink>;
  sendOAuthLinkEmail: (pendingLinkId: string, email: string) => Promise<void>;
  verifyOAuthLink: (pendingLinkId: string, email: string, code: string) => Promise<AuthSession>;
}>) {
  return {
    exchangeMobileOAuth: jest.fn(),
    sendOAuthLinkEmail: jest.fn(),
    verifyOAuthLink: jest.fn(),
    ...overrides,
  };
}

describe('isPendingLinkResponse', () => {
  it('detects pending_link payload', () => {
    expect(isPendingLinkResponse(pending)).toBe(true);
    expect(isPendingLinkResponse(session)).toBe(false);
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
      nonce: 'n',
    });
    expect(result).toEqual({ kind: 'session', session });
  });

  it('returns pending_link when API responds with status', async () => {
    const client = mockClient({
      exchangeMobileOAuth: async () => pending,
    });
    const result = await exchangeOAuthToken(client, {
      provider: 'facebook',
      accessToken: 'fb',
    });
    expect(result).toEqual({ kind: 'pending_link', pending });
  });

  it('maps ApiError to error result', async () => {
    const client = mockClient({
      exchangeMobileOAuth: async () => {
        throw new ApiError('bad token', 401);
      },
    });
    const result = await exchangeOAuthToken(client, { provider: 'apple', idToken: 'x' });
    expect(result).toEqual({ kind: 'error', message: 'bad token' });
  });
});

describe('mapOAuthApiError', () => {
  it('maps oauth_cancelled to cancelled', () => {
    expect(mapOAuthApiError(new Error('oauth_cancelled'))).toEqual({ kind: 'cancelled' });
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
