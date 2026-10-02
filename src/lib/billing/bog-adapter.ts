import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import {
  bogCreateOrder,
  bogGetPaymentDetails,
  bogOrderStatusFromCallbackBody,
  parseBogCallback,
  verifyBogCallbackSignature,
  bogOrderIsPaid,
  bogOrderIsTerminalFailure,
  mapBogOrderStatus,
} from "@/lib/billing/bog-client";
import { bogCallbackUrl, bogConfigured, normalizeBogOrderStatus } from "@/lib/billing/bog-config";
import { prisma } from "@/lib/prisma";
import { markPaymentFailed, markPaymentPaid } from "@/lib/billing/activate-payment";
import {
  mockCheckoutUrl,
  mockExternalId,
  paymentMockEnabled,
} from "@/lib/billing/payment-mock";

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
    if (paymentMockEnabled()) {
      return resolveMockBogWebhook(raw);
    }

    const sig = req.headers.get("Callback-Signature");
    if (!verifyBogCallbackSignature(raw, sig)) {
      return { ok: false };
    }

    const callback = parseBogCallback(raw);
    if (!callback?.body) return { ok: false };

    if (callback.event && callback.event !== "order_payment") {
      return { ok: true };
    }

    const orderStatus = bogOrderStatusFromCallbackBody(callback.body);
    return resolveBogOrder(
      callback.body.order_id,
      callback.body.external_order_id,
      orderStatus,
    );
  },

  async pollPayment(externalId: string): Promise<WebhookVerifyResult> {
    if (paymentMockEnabled() && externalId.startsWith("mock-bog-")) {
      return resolveMockBogOrderId(externalId);
    }
    try {
      const details = await bogGetPaymentDetails(externalId);
      const orderStatus = normalizeBogOrderStatus(details.order_status);
      return resolveBogOrder(
        details.order_id ?? externalId,
        details.external_order_id,
        orderStatus,
      );
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
      event?: string;
      body?: { order_id?: string; external_order_id?: string; order_status?: string };
    };
    const payload = body.body ?? body;
    if (body.outcome === "fail" || payload.order_status === "rejected") {
      return { ok: true, status: "failed", paymentId: payload.order_id };
    }
    return resolveBogOrder(
      payload.order_id,
      payload.external_order_id,
      payload.order_status ?? "completed",
    );
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
  const mapped = mapBogOrderStatus(orderStatus);

  if (mapped === "pending") {
    return { ok: true, paymentId: orderId };
  }

  const payment = externalOrderId
    ? await prisma.payment.findUnique({ where: { id: externalOrderId } })
    : orderId
      ? await prisma.payment.findFirst({ where: { externalId: orderId, provider: "bog" } })
      : null;

  const ref = orderId ?? externalOrderId ?? payment?.id;

  if (mapped === "failed" || bogOrderIsTerminalFailure(orderStatus)) {
    if (ref) await markPaymentFailed(ref);
    return { ok: true, status: "failed", paymentId: orderId };
  }

  if (!bogOrderIsPaid(orderStatus)) {
    return { ok: true, status: "failed", paymentId: orderId };
  }

  const eventId = payment?.eventId;
  if (!eventId) {
    return { ok: true, paymentId: orderId, status: "failed" };
  }

  const paidRef = orderId ?? externalOrderId ?? payment.id;
  await markPaymentPaid(paidRef, eventId);
  return {
    ok: true,
    eventId,
    paymentId: orderId,
    status: "paid",
  };
}
