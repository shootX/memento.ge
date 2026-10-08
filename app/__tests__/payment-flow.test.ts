import { clearPendingPayment, pollPaymentStatus, rememberPaymentSession } from '@/src/lib/payment-flow';

jest.mock('@/src/api/client', () => ({
  api: {
    getPaymentStatus: jest.fn(),
  },
}));

import { api } from '@/src/api/client';

describe('payment-flow', () => {
  beforeEach(() => {
    clearPendingPayment('tok');
    jest.clearAllMocks();
  });

  it('polls until paid', async () => {
    rememberPaymentSession('tok', 'pay-1');
    (api.getPaymentStatus as jest.Mock)
      .mockResolvedValueOnce({ status: 'pending', isPaid: false })
      .mockResolvedValueOnce({ status: 'paid', isPaid: true });

    const result = await pollPaymentStatus('tok', 'pay-1', 'bearer', {
      attempts: 3,
      delayMs: 1,
    });
    expect(result.isPaid).toBe(true);
  });
});
