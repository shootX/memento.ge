import { spawn } from 'node:child_process';
import path from 'node:path';
import { createLiveClient } from '@/src/api/client';
import { ApiError } from '@/src/api/http';

const PORT = 3998;
const BASE = `http://127.0.0.1:${PORT}`;

jest.mock('@/src/config', () => ({
  config: {
    apiUrl: `http://127.0.0.1:${PORT}`,
    useMockApi: false,
    deepLinkHost: 'memento.ge',
    authRedirectUri: 'memento://auth/callback',
  },
}));

describe('MOBILE-API contract (local mock server)', () => {
  let proc: ReturnType<typeof spawn>;

  beforeAll(async () => {
    const script = path.join(__dirname, '..', 'scripts', 'mock-api-server.mjs');
    proc = spawn(process.execPath, [script, String(PORT)], { stdio: 'pipe' });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('mock server timeout')), 8000);
      proc.stdout?.on('data', (d) => {
        if (String(d).includes('listening')) {
          clearTimeout(t);
          resolve();
        }
      });
      proc.on('error', reject);
    });
  }, 15000);

  afterAll(() => {
    proc.kill('SIGTERM');
  });

  const client = createLiveClient();

  it('verify-code rejects invalid input', async () => {
    await expect(client.verifyLoginCode('a@b.c', '000000')).rejects.toBeInstanceOf(ApiError);
  });

  it('verify-code accepts valid code', async () => {
    const s = await client.verifyLoginCode('a@b.c', '123456');
    expect(s.accessToken).toBe('test-bearer');
  });

  it('exchange rejects bad token', async () => {
    await expect(client.exchangeMagicToken('bad')).rejects.toBeInstanceOf(ApiError);
  });

  it('guest event 404 for missing slug', async () => {
    await expect(client.getGuestEvent('missing', 'gk')).rejects.toMatchObject({ status: 404 });
  });

  it('dashboard requires bearer', async () => {
    await expect(client.listMyEvents('')).rejects.toMatchObject({ status: 401 });
  });

  it('auth/me detects expired token', async () => {
    await expect(client.getAuthMe('expired')).rejects.toMatchObject({ status: 401 });
  });

  it('gallery locked empty state', async () => {
    const g = await client.getGallery('locked');
    expect(g.locked).toBe(true);
  });

  it('host bootstrap 404', async () => {
    await expect(client.getHost('bad')).rejects.toMatchObject({ status: 404 });
  });

  it('mobile password login success', async () => {
    const s = await client.mobilePasswordLogin('a@b.c', 'secretpass');
    expect(s.accessToken).toBe('password-login-bearer');
  });

  it('mobile password login 401', async () => {
    await expect(client.mobilePasswordLogin('a@b.c', 'bad')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('mobile password register success', async () => {
    const s = await client.mobilePasswordRegister({
      email: 'new@b.c',
      password: 'secretpass',
      name: 'Test',
    });
    expect(s.accessToken).toBe('password-register-bearer');
  });

  it('mobile oauth returns session', async () => {
    const s = await client.exchangeMobileOAuth({
      provider: 'google',
      idToken: 'test-jwt',
    });
    expect(s.accessToken).toBe('oauth-bearer');
  });

  it('mobile oauth rejects bad id token', async () => {
    await expect(
      client.exchangeMobileOAuth({ provider: 'google', idToken: 'bad-id-token' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('mobile oauth facebook link flow', async () => {
    await expect(
      client.exchangeMobileOAuth({ provider: 'facebook', accessToken: 'pending-fb' }),
    ).rejects.toMatchObject({
      status: 409,
      body: { code: 'OAUTH_LINK_REQUIRED', pendingLinkId: 'test-pending-1' },
    });
    await client.startOAuthLink('test-pending-1', 'link@example.com');
    const linked = await client.verifyOAuthLink('test-pending-1', 'link@example.com', '123456');
    expect(linked.accessToken).toBe('oauth-linked-bearer');
  });

  it('payment session + status', async () => {
    const session = await client.createPaymentSession('test-host-token', 'memento://x', 'test-bearer');
    expect(session.paymentId).toBe('pay-test-1');
    const status = await client.getPaymentStatus('test-host-token', session.paymentId, 'test-bearer');
    expect(status.isPaid).toBe(true);
  });
});
