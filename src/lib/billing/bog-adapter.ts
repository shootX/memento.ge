import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import {
  bogCreateOrder,
  bogGetOrder,
  bogOrderIsPaid,
  parseBogCallback,
  verifyBogCallbackSignature,
} from "@/lib/billing/bog-client";
import { bogConfigured } from "@/lib/billing/bog-config";
import { prisma } from "@/lib/prisma";
import { markPaymentPaid } from "@/lib/billing/activate-payment";
import {
  mockCheckoutUrl,
  mockExternalId,
  paymentMockEnabled,
} from "@/lib/billing/payment-mock";
import { appUrl } from "@/lib/site-config";

export const bogAdapter: BillingAdapter = {
  id: "bog",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    if (paymentMockEnabled()) {
      const orderId = mockExternalId(req.paymentId, "bog");
      return {
        provider: "bog",
        status: "created",
        sessionId: orderId,
        checkoutUrl: mockCheckoutUrl(req.paymentId, "bog"),
      };
    }

    if (!bogConfigured()) {
      return { provider: "bog", status: "manual", message: "bog_not_configured" };
    }

    const base = appUrl();
    const order = await bogCreateOrder({
      externalOrderId: req.paymentId,
      amountGel: req.amountGel,
      callbackUrl: `${base}/api/webhooks/bog`,
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
    if (paymentMockEnabled()) {
      return resolveMockBogWebhook(raw);
    }

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

    return resolveBogOrder(callback.body.order_id, callback.body.external_order_id, callback.body.order_status);
  },

  async pollPayment(externalId: string): Promise<WebhookVerifyResult> {
    if (paymentMockEnabled() && externalId.startsWith("mock-bog-")) {
      return resolveMockBogOrderId(externalId);
    }
    try {
      const details = await bogGetOrder(externalId);
      return resolveBogOrder(externalId, undefined, details.order_status);
    } catch {
      return { ok: false };
    }
  },
};

async function resolveMockBogWebhook(raw: string): Promise<WebhookVerifyResult> {
  try {
    const body = JSON.parse(raw) as {
      order_id?: string;
      external_order_id?: string;
      order_status?: string;
      outcome?: string;
    };
    if (body.outcome === "fail") {
      return { ok: true, status: "failed", paymentId: body.order_id };
    }
    return resolveBogOrder(body.order_id, body.external_order_id, body.order_status ?? "completed");
  } catch {
    return { ok: false };
  }
}

async function resolveMockBogOrderId(orderId: string): Promise<WebhookVerifyResult> {
  const paymentId = orderId.replace(/^mock-bog-/, "");
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.eventId) return { ok: true, paymentId: orderId, status: "failed" };
  await markPaymentPaid(orderId, payment.eventId);
  return { ok: true, eventId: payment.eventId, paymentId: orderId, status: "paid" };
}

async function resolveBogOrder(
  orderId: string | undefined,
  externalOrderId: string | undefined,
  orderStatus: string | undefined,
): Promise<WebhookVerifyResult> {
  if (!bogOrderIsPaid(orderStatus)) {
    return { ok: true, status: "failed", paymentId: orderId };
  }

  const payment = externalOrderId
    ? await prisma.payment.findUnique({ where: { id: externalOrderId } })
    : orderId
      ? await prisma.payment.findFirst({ where: { externalId: orderId, provider: "bog" } })
      : null;

  const eventId = payment?.eventId;
  if (!eventId) {
    return { ok: true, paymentId: orderId, status: "failed" };
  }

  const ref = orderId ?? externalOrderId ?? payment.id;
  await markPaymentPaid(ref, eventId);
  return {
    ok: true,
    eventId,
    paymentId: orderId,
    status: "paid",
  };
}
