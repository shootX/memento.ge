import { api } from '@/src/api/client';
import type { PaymentStatus } from '@/src/api/types';

const pendingByHost = new Map<string, string>();

export function rememberPaymentSession(hostToken: string, paymentId: string) {
  pendingByHost.set(hostToken, paymentId);
}

export function getPendingPaymentId(hostToken: string): string | undefined {
  return pendingByHost.get(hostToken);
}

export function clearPendingPayment(hostToken: string) {
  pendingByHost.delete(hostToken);
}

export async function pollPaymentStatus(
  hostToken: string,
  paymentId: string,
  bearerToken: string | null | undefined,
  options?: { attempts?: number; delayMs?: number },
): Promise<PaymentStatus> {
  const attempts = options?.attempts ?? 8;
  const delayMs = options?.delayMs ?? 1500;
  let last: PaymentStatus = { status: 'pending', isPaid: false };

  for (let i = 0; i < attempts; i += 1) {
    last = await api.getPaymentStatus(hostToken, paymentId, bearerToken);
    if (last.isPaid || last.status === 'paid') {
      clearPendingPayment(hostToken);
      return last;
    }
    if (last.status === 'failed') return last;
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return last;
}
