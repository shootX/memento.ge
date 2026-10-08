import type { CheckoutSessionRequest, CheckoutSessionResult } from "@/lib/billing/types";
import { getBillingAdapter } from "@/lib/billing";
import {
  manualPayConfigured,
  preferredCheckoutProvider,
  type CheckoutProvider,
} from "@/lib/site-config";

export async function startEventCheckout(
  provider: CheckoutProvider | "auto",
  req: CheckoutSessionRequest,
): Promise<CheckoutSessionResult & { providerUsed: CheckoutProvider }> {
  const chosen: CheckoutProvider =
    provider === "auto"
      ? (preferredCheckoutProvider() ?? (manualPayConfigured() ? "manual" : "manual"))
      : provider;

  const adapter = getBillingAdapter(chosen);
  const result = await adapter.createCheckout(req);

  if (result.checkoutUrl) {
    return { ...result, providerUsed: chosen };
  }

  if (chosen !== "manual") {
    const fallback = preferredCheckoutProvider();
    if (fallback && fallback !== chosen) {
      const second = await getBillingAdapter(fallback).createCheckout(req);
      if (second.checkoutUrl) {
        return { ...second, providerUsed: fallback };
      }
    }
  }

  return {
    provider: "manual",
    providerUsed: "manual",
    status: "manual",
    message: "manual_payment",
  };
}
