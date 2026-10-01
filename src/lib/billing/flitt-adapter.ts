import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import {
  flittAmountMinorUnits,
  flittBuildSignature,
  flittVerifyCallback,
} from "@/lib/billing/flitt-signature";
import { prisma } from "@/lib/prisma";
import { markPaymentPaid, parsePaymentMetadata } from "@/lib/billing/activate-payment";

const FLITT_API = process.env.FLITT_API_URL ?? "https://pay.flitt.com/api/checkout/url";

function configured(): boolean {
  return Boolean(process.env.FLITT_MERCHANT_ID && process.env.FLITT_SECRET_KEY);
}

function flattenParams(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}

export const flittAdapter: BillingAdapter = {
  id: "flitt",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    if (!configured()) {
      return {
        provider: "flitt",
        status: "manual",
        message: "Flitt არ არის კონფიგურირებული (FLITT_MERCHANT_ID, FLITT_SECRET_KEY).",
      };
    }

    const merchantId = Number(process.env.FLITT_MERCHANT_ID);
    const secret = process.env.FLITT_SECRET_KEY!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:43123";

    const requestParams: Record<string, string | number> = {
      merchant_id: merchantId,
      order_id: req.paymentId,
      order_desc: `Memento ${req.planTier}`.slice(0, 100),
      amount: flittAmountMinorUnits(req.amountGel),
      currency: "GEL",
      response_url: req.successUrl,
      server_callback_url: `${appUrl}/api/webhooks/flitt`,
      merchant_data: JSON.stringify({ eventId: req.eventId, paymentId: req.paymentId }),
    };

    requestParams.signature = flittBuildSignature(secret, requestParams);

    const res = await fetch(FLITT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: requestParams }),
    });

    const json = (await res.json()) as {
      response?: { checkout_url?: string; error_message?: string };
    };

    if (!res.ok || !json.response?.checkout_url) {
      return {
        provider: "flitt",
        status: "manual",
        message: json.response?.error_message ?? "Flitt checkout failed",
      };
    }

    return {
      provider: "flitt",
      status: "created",
      sessionId: req.paymentId,
      checkoutUrl: json.response.checkout_url,
    };
  },

  async verifyWebhook(_req: Request, raw: string): Promise<WebhookVerifyResult> {
    return parseFlittPayload(raw);
  },
};

export async function parseFlittPayload(raw: string): Promise<WebhookVerifyResult> {
  let params: Record<string, string>;
  try {
    if (raw.trim().startsWith("{")) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed.request && typeof parsed.request === "object") {
        params = flattenParams(parsed.request as Record<string, unknown>);
      } else {
        params = flattenParams(parsed);
      }
    } else {
      params = Object.fromEntries(new URLSearchParams(raw));
    }
  } catch {
    return { ok: false };
  }

  const secret = process.env.FLITT_SECRET_KEY;
  if (secret && !flittVerifyCallback(secret, params)) {
    return { ok: false };
  }

  if (params.order_status !== "approved" || params.response_status !== "success") {
    return { ok: true, status: "failed", paymentId: params.order_id };
  }

  let eventId: string | undefined;
  if (params.merchant_data) {
    try {
      const md = JSON.parse(params.merchant_data) as { eventId?: string };
      eventId = md.eventId;
    } catch {
      /* ignore */
    }
  }

  const payment = params.order_id
    ? await prisma.payment.findUnique({ where: { id: params.order_id } })
    : null;
  const meta = parsePaymentMetadata(payment?.metadata);
  const resolvedEventId =
    eventId ??
    payment?.eventId ??
    (typeof meta.eventId === "string" ? meta.eventId : undefined);

  if (!resolvedEventId) {
    return { ok: true, paymentId: params.order_id, status: "failed" };
  }

  await markPaymentPaid(params.order_id, resolvedEventId);
  return { ok: true, eventId: resolvedEventId, paymentId: params.order_id, status: "paid" };
}
