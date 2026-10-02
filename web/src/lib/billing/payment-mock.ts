import { appUrl } from "@/lib/site-config";
import type { PaymentProvider } from "@/lib/billing/types";

export function paymentMockEnabled(): boolean {
  return process.env.PAYMENT_MOCK === "1";
}

export function mockCheckoutUrl(
  paymentId: string,
  provider: PaymentProvider,
  hostToken?: string,
): string {
  const base = appUrl();
  const q = new URLSearchParams({
    paymentId,
    provider,
  });
  if (hostToken) q.set("hostToken", hostToken);
  return `${base}/pay/mock?${q.toString()}`;
}

export function mockExternalId(paymentId: string, provider: PaymentProvider): string {
  return `mock-${provider}-${paymentId}`;
}
