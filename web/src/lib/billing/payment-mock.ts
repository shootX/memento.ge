import { appUrl } from "@/lib/site-config";
import type { PaymentProvider } from "@/lib/billing/types";
import type { PaymentUiLocale } from "@/lib/payment-ui-copy";

export function paymentMockEnabled(): boolean {
  return process.env.PAYMENT_MOCK === "1";
}

export type MockCheckoutQuery = {
  hostToken?: string;
  amountGel?: number;
  locale?: PaymentUiLocale;
};

export function mockCheckoutUrl(
  paymentId: string,
  provider: PaymentProvider,
  opts?: MockCheckoutQuery,
): string {
  const base = appUrl();
  const q = new URLSearchParams({
    paymentId,
    provider,
  });
  if (opts?.hostToken) q.set("hostToken", opts.hostToken);
  if (opts?.amountGel != null) q.set("amount", String(opts.amountGel));
  q.set("locale", opts?.locale ?? "ka");
  return `${base}/pay/mock?${q.toString()}`;
}

export function mockExternalId(paymentId: string, provider: PaymentProvider): string {
  return `mock-${provider}-${paymentId}`;
}
