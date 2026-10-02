import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import {
  bogCreateOrder,
  parseBogCallback,
} from "@/lib/billing/bog-client";
import { processSignedBogCallback, verifyBogPublicCallbackSignature } from "@/lib/billing/bog-public-callback";
import { bogCallbackUrl, bogConfigured } from "@/lib/billing/bog-config";
import {
  mockCheckoutUrl,
  mockExternalId,
  paymentMockEnabled,
} from "@/lib/billing/payment-mock";
import { activateMockBogPayment } from "@/lib/billing/tbc-public-callback";

function bogAcceptLanguage(req: CheckoutSessionRequest): "ka" | "en" {
  return req.checkoutLocale === "en" ? "en" : "ka";
}

function bogApplicationType(req: CheckoutSessionRequest): "web" | "mobile" | undefined {
  if (req.successUrl.startsWith("memento://")) return "mobile";
  return "web";
}

export const bogAdapter: BillingAdapter = {
  id: "bog",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    if (paymentMockEnabled()) {
      const orderId = mockExternalId(req.paymentId, "bog");
      return {
        provider: "bog",
        status: "created",
        sessionId: orderId,
        checkoutUrl: mockCheckoutUrl(req.paymentId, "bog", { amountGel: req.amountGel }),
      };
    }

    if (!bogConfigured()) {
      return { provider: "bog", status: "manual", message: "bog_not_configured" };
    }

    const order = await bogCreateOrder({
      externalOrderId: req.paymentId,
      amountGel: req.amountGel,
      callbackUrl: bogCallbackUrl(),
      successUrl: req.successUrl,
      failUrl: req.cancelUrl,
      acceptLanguage: bogAcceptLanguage(req),
      applicationType: bogApplicationType(req),
    });

    if (!order.redirect) {
      return { provider: "bog", status: "manual", message: "bog_no_redirect" };
    }

    return {
      provider: "bog",
      status: "created",
      sessionId: order.order_id,
      checkoutUrl: order.redirect,
    };
  },

  async verifyWebhook(req: Request, raw: string): Promise<WebhookVerifyResult> {
    if (!verifyBogPublicCallbackSignature(req, raw)) {
      return { ok: false };
    }
    const callback = parseBogCallback(raw);
    if (!callback?.body) return { ok: false };
    return processSignedBogCallback(callback);
  },

  async pollPayment(externalId: string): Promise<WebhookVerifyResult> {
    if (paymentMockEnabled() && externalId.startsWith("mock-bog-")) {
      const paymentId = externalId.replace(/^mock-bog-/, "");
      return activateMockBogPayment(externalId, paymentId);
    }
    return processSignedBogCallback({
      event: "order_payment",
      body: { order_id: externalId },
    });
  },
};
