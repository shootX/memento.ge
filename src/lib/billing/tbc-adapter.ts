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
import { tbcConfigured } from "@/lib/billing/tbc-config";
import {
  markPaymentPaid,
  parsePaymentMetadata,
} from "@/lib/billing/activate-payment";
import {
  mockCheckoutUrl,
  mockExternalId,
  paymentMockEnabled,
} from "@/lib/billing/payment-mock";
import { appUrl } from "@/lib/site-config";

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

  async verifyWebhook(_req: Request, raw: string): Promise<WebhookVerifyResult> {
    if (paymentMockEnabled()) {
      return resolveMockTbcWebhook(raw);
    }

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
    if (paymentMockEnabled() && externalId.startsWith("mock-tbc-")) {
      return resolveTbcPayId(externalId);
    }
    return resolveTbcPayId(externalId);
  },
};

async function resolveMockTbcWebhook(raw: string): Promise<WebhookVerifyResult> {
  try {
    const body = JSON.parse(raw) as { payId?: string; paymentId?: string; outcome?: string };
    const payId = body.payId ?? body.paymentId;
    if (!payId || body.outcome === "fail") return { ok: true, status: "failed", paymentId: payId };
    return resolveTbcPayId(payId);
  } catch {
    return { ok: false };
  }
}

async function resolveTbcPayId(payId: string): Promise<WebhookVerifyResult> {
  if (paymentMockEnabled() && payId.startsWith("mock-tbc-")) {
    const paymentId = payId.replace(/^mock-tbc-/, "");
    const paymentRow = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!paymentRow?.eventId) return { ok: true, paymentId: payId, status: "failed" };
    await markPaymentPaid(payId, paymentRow.eventId);
    return { ok: true, eventId: paymentRow.eventId, paymentId: payId, status: "paid" };
  }

  if (!tbcConfigured()) return { ok: false };

  const details = await tbcGetPayment(payId);
  if (!tbcIsPaidStatus(details.status)) {
    return { ok: true, status: "failed", paymentId: payId };
  }

  const paymentRow = await prisma.payment.findFirst({
    where: { OR: [{ externalId: payId }, { id: details.merchantPaymentId ?? "" }] },
  });
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
