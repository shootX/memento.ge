import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import {
  tbcCreatePayment,
  tbcCheckoutUrl,
} from "@/lib/billing/tbc-client";
import { tbcConfigured } from "@/lib/billing/tbc-config";
import {
  mockCheckoutUrl,
  mockExternalId,
  paymentMockEnabled,
} from "@/lib/billing/payment-mock";
import { appUrl } from "@/lib/site-config";
import { verifyTbcPublicCallbackAuth } from "@/lib/billing/tbc-webhook-auth";
import {
  activateMockTbcPayment,
  processSignedTbcCallback,
} from "@/lib/billing/tbc-public-callback";

export const tbcAdapter: BillingAdapter = {
  id: "tbc",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    if (paymentMockEnabled()) {
      const payId = mockExternalId(req.paymentId, "tbc");
      return {
        provider: "tbc",
        status: "created",
        sessionId: payId,
        checkoutUrl: mockCheckoutUrl(req.paymentId, "tbc", { amountGel: req.amountGel }),
      };
    }

    if (!tbcConfigured()) {
      return { provider: "tbc", status: "manual", message: "tbc_not_configured" };
    }

    const base = appUrl();
    const callbackUrl =
      process.env.TBC_CALLBACK_URL ?? `${base}/api/webhooks/tbc`;

    const created = await tbcCreatePayment(
      {
        amount: { currency: "GEL", total: req.amountGel },
        returnurl: req.successUrl,
        callbackUrl,
        merchantPaymentId: req.paymentId,
        description: `Memento ${req.planTier}`.slice(0, 30),
        language: "KA",
      },
      req.paymentId,
    );

    const payId = created.payId;
    if (!payId) {
      return { provider: "tbc", status: "manual", message: "tbc_pay_id_missing" };
    }

    return {
      provider: "tbc",
      status: "created",
      sessionId: payId,
      checkoutUrl: tbcCheckoutUrl(created),
    };
  },

  async verifyWebhook(req: Request, raw: string): Promise<WebhookVerifyResult> {
    if (!verifyTbcPublicCallbackAuth(req, raw)) {
      return { ok: false };
    }
    let body: { PaymentId?: string; paymentId?: string };
    try {
      body = JSON.parse(raw) as { PaymentId?: string; paymentId?: string };
    } catch {
      return { ok: false };
    }
    const payId = body.PaymentId ?? body.paymentId;
    if (!payId) return { ok: false };
    return processSignedTbcCallback(payId);
  },

  async pollPayment(externalId: string): Promise<WebhookVerifyResult> {
    if (paymentMockEnabled() && externalId.startsWith("mock-tbc-")) {
      return activateMockTbcPayment(externalId);
    }
    return processSignedTbcCallback(externalId);
  },
};
