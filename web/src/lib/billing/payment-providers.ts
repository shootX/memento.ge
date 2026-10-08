import { bogConfigured } from "@/lib/billing/bog-config";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";
import { tbcConfigured } from "@/lib/billing/tbc-config";
import type { CheckoutProvider } from "@/lib/site-config";

export type PaymentProviderOption = {
  id: CheckoutProvider;
  labelKa: string;
  badges: string[];
};

export function listPaymentProviderOptions(): PaymentProviderOption[] {
  const out: PaymentProviderOption[] = [];

  if (paymentMockEnabled() || tbcConfigured()) {
    out.push({
      id: "tbc",
      labelKa: "TBC ბანკი",
      badges: ["Apple Pay", "Google Pay", "ბარათი"],
    });
  }

  if (paymentMockEnabled() || bogConfigured()) {
    out.push({
      id: "bog",
      labelKa: "საქართველოს ბანკი",
      badges: ["Apple Pay", "Google Pay", "ბარათი"],
    });
  }

  if (process.env.FLITT_MERCHANT_ID && process.env.FLITT_SECRET_KEY) {
    out.push({
      id: "flitt",
      labelKa: "Flitt",
      badges: ["ბარათი"],
    });
  }

  return out;
}
