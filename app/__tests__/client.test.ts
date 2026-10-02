jest.mock('@/src/config', () => ({
  config: { apiUrl: 'https://test.example', useMockApi: false, deepLinkHost: 'memento.ge' },
}));

import { createLiveClient } from '@/src/api/client';

describe('createLiveClient mock fallbacks', () => {
  const client = createLiveClient();

  it('returns mock dashboard events when unauthorized', async () => {
    const events = await client.listMyEvents('invalid-token-for-live');
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].coupleNames).toBeTruthy();
  });

  it('builds payment url', () => {
    expect(client.getPaymentUrl('tok')).toContain('/host/tok/pay');
  });
});
