jest.mock('@/src/config', () => ({
  config: {
    apiUrl: 'https://test.example',
    useMockApi: true,
    deepLinkHost: 'memento.ge',
    authRedirectUri: 'memento://auth/callback',
  },
}));

import { createLiveClient } from '@/src/api/client';
import { ApiError } from '@/src/api/http';

describe('password auth (mock)', () => {
  const client = createLiveClient();

  it('login with valid mock password', async () => {
    const s = await client.mobilePasswordLogin('a@b.c', 'password123');
    expect(s.accessToken).toBe('mock-password-login');
  });

  it('login wrong password throws 401', async () => {
    await expect(client.mobilePasswordLogin('a@b.c', 'wrong')).rejects.toBeInstanceOf(ApiError);
  });

  it('register returns session', async () => {
    const s = await client.mobilePasswordRegister({ email: 'x@y.z', password: 'password123' });
    expect(s.accessToken).toBe('mock-password-register');
  });
});
