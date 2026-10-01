import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import {
  bogCreateOrder,
  bogOrderIsPaid,
  parseBogCallback,
  verifyBogCallbackSignature,
} from "@/lib/billing/bog-client";
import { prisma } from "@/lib/prisma";
import { markPaymentPaid } from "@/lib/billing/activate-payment";

function configured(): boolean {
  return Boolean(process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET);
}

export const bogAdapter: BillingAdapter = {
  id: "bog",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    if (!configured()) {
      return {
        provider: "bog",
        status: "manual",
        message: "BOG არ არის კონფიგურირებული (BOG_CLIENT_ID, BOG_CLIENT_SECRET).",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:43123";
    const order = await bogCreateOrder({
      externalOrderId: req.paymentId,
      amountGel: req.amountGel,
      callbackUrl: `${appUrl}/api/webhooks/bog`,
      successUrl: req.successUrl,
      failUrl: req.cancelUrl,
    });

    return {
      provider: "bog",
      status: "created",
      sessionId: order.order_id,
      checkoutUrl: order.redirect,
    };
  },

  async verifyWebhook(req: Request, raw: string): Promise<WebhookVerifyResult> {
    const sig = req.headers.get("Callback-Signature");
    const pemConfigured = Boolean(process.env.BOG_CALLBACK_PUBLIC_KEY?.trim());
    if (pemConfigured && !verifyBogCallbackSignature(raw, sig)) {
      return { ok: false };
    }

    const callback = parseBogCallback(raw);
    if (!callback?.body) return { ok: false };

    if (callback.event && callback.event !== "order_payment") {
      return { ok: true };
    }

    const externalId = callback.body.external_order_id;
    const orderStatus = callback.body.order_status;
    if (!bogOrderIsPaid(orderStatus)) {
      return { ok: true, status: "failed", paymentId: callback.body.order_id };
    }

    const payment = externalId
      ? await prisma.payment.findUnique({ where: { id: externalId } })
      : null;

    const eventId = payment?.eventId;
    if (!eventId) {
      return { ok: true, paymentId: callback.body.order_id, status: "failed" };
    }

    const ref = callback.body.order_id ?? externalId ?? payment.id;
    await markPaymentPaid(ref, eventId);
    return {
      ok: true,
      eventId,
      paymentId: callback.body.order_id,
      status: "paid",
    };
  },
};
