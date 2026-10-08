jest.mock('@/src/config', () => ({
  config: {
    apiUrl: 'https://test.example',
    useMockApi: true,
    deepLinkHost: 'memento.ge',
    authRedirectUri: 'memento://auth/callback',
  },
}));

import { createLiveClient } from '@/src/api/client';

describe('createLiveClient', () => {
  const client = createLiveClient();

  it('returns mock dashboard events in mock mode', async () => {
    const events = await client.listMyEvents('token');
    expect(events.length).toBeGreaterThan(0);
  });

  it('builds payment url', () => {
    expect(client.getPaymentUrl('tok')).toContain('/host/tok/pay');
  });

  it('returns demo guest fixture', async () => {
    const ev = await client.getGuestEvent('demo', 'gk');
    expect(ev.coupleNames).toContain('ნინო');
  });

  it('creates mock payment session for demo host', async () => {
    const s = await client.createPaymentSession('mock-token-abc', 'memento://x');
    expect(s.checkoutUrl).toContain('mock-token-abc');
  });
});
