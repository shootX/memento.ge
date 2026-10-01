import type {
  BillingAdapter,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  WebhookVerifyResult,
} from "@/lib/billing/types";
import { prisma } from "@/lib/prisma";
import {
  tbcCreatePayment,
  tbcCheckoutUrl,
  tbcGetPayment,
  tbcIsPaidStatus,
} from "@/lib/billing/tbc-client";
import {
  markPaymentPaid,
  parsePaymentMetadata,
} from "@/lib/billing/activate-payment";

function configured(): boolean {
  return Boolean(
    process.env.TBC_API_KEY &&
      process.env.TBC_CLIENT_ID &&
      process.env.TBC_CLIENT_SECRET,
  );
}

export const tbcAdapter: BillingAdapter = {
  id: "tbc",

  async createCheckout(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    if (!configured()) {
      return {
        provider: "tbc",
        status: "manual",
        message:
          "TBC Checkout არ არის კონფიგურირებული (TBC_API_KEY, TBC_CLIENT_ID, TBC_CLIENT_SECRET).",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:43123";
    const callbackUrl =
      process.env.TBC_CALLBACK_URL ?? `${appUrl}/api/webhooks/tbc`;

    const created = await tbcCreatePayment({
      amount: { currency: "GEL", total: req.amountGel },
      returnurl: req.successUrl,
      callbackUrl,
      merchantPaymentId: req.paymentId,
      description: `Memento ${req.planTier}`.slice(0, 30),
      language: "KA",
    });

    const payId = created.payId;
    if (!payId) {
      return { provider: "tbc", status: "manual", message: "TBC payId missing" };
    }

    return {
      provider: "tbc",
      status: "created",
      sessionId: payId,
      checkoutUrl: tbcCheckoutUrl(created),
    };
  },

  async verifyWebhook(_req: Request, raw: string): Promise<WebhookVerifyResult> {
    let body: { PaymentId?: string; paymentId?: string };
    try {
      body = JSON.parse(raw) as { PaymentId?: string; paymentId?: string };
    } catch {
      return { ok: false };
    }
    const payId = body.PaymentId ?? body.paymentId;
    if (!payId) return { ok: false };

    return resolveTbcPayId(payId);
  },

  async pollPayment(externalId: string): Promise<WebhookVerifyResult> {
    return resolveTbcPayId(externalId);
  },
};

async function resolveTbcPayId(payId: string): Promise<WebhookVerifyResult> {
  if (!configured()) return { ok: false };

  const details = await tbcGetPayment(payId);
  if (!tbcIsPaidStatus(details.status)) {
    return { ok: true, status: "failed", paymentId: payId };
  }

  const paymentRow = await prisma.payment.findFirst({
    where: { externalId: payId, provider: "tbc" },
  });
  const merchantId = details.merchantPaymentId ?? paymentRow?.id;
  const meta = parsePaymentMetadata(paymentRow?.metadata);
  const eventId =
    (typeof meta.eventId === "string" ? meta.eventId : undefined) ??
    paymentRow?.eventId ??
    undefined;

  if (!eventId) {
    return { ok: true, paymentId: payId, status: "failed" };
  }

  await markPaymentPaid(payId, eventId);

  return { ok: true, eventId, paymentId: payId, status: "paid" };
}
