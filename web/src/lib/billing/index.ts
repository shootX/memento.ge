import type { BillingAdapter, PaymentProvider } from "@/lib/billing/types";
import { stripeAdapter } from "@/lib/billing/stripe-adapter";
import { bogAdapter } from "@/lib/billing/bog-adapter";
import { tbcAdapter } from "@/lib/billing/tbc-adapter";
import { flittAdapter } from "@/lib/billing/flitt-adapter";

const adapters: Record<PaymentProvider, BillingAdapter> = {
  stripe: stripeAdapter,
  bog: bogAdapter,
  tbc: tbcAdapter,
  flitt: flittAdapter,
  manual: {
    id: "manual",
    async createCheckout() {
      return { provider: "manual", status: "manual", message: "Manual payment" };
    },
    async verifyWebhook() {
      return { ok: false };
    },
  },
};

export function getBillingAdapter(provider: PaymentProvider): BillingAdapter {
  return adapters[provider];
}
