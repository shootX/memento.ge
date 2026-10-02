import { prisma } from "@/lib/prisma";
import { tbcGetPayment, tbcIsPaidStatus } from "@/lib/billing/tbc-client";
import { tbcConfigured } from "@/lib/billing/tbc-config";
import { markPaymentFailed, markPaymentPaid } from "@/lib/billing/activate-payment";
import type { WebhookVerifyResult } from "@/lib/billing/types";

type TbcPaymentRow = {
  amount?: { currency?: string; total?: number };
  merchantPaymentId?: string;
  status?: string;
  payId?: string;
};

export async function processSignedTbcCallback(payId: string): Promise<WebhookVerifyResult> {
  if (!tbcConfigured()) {
    return { ok: false };
  }

  let details: TbcPaymentRow;
  try {
    details = (await tbcGetPayment(payId)) as TbcPaymentRow;
  } catch {
    return { ok: false };
  }

  const paymentRow = await prisma.payment.findFirst({
    where: {
      OR: [{ externalId: payId }, { id: details.merchantPaymentId ?? "" }],
    },
  });

  if (!paymentRow) {
    return { ok: true, paymentId: payId, status: "failed" };
  }

  const currency = details.amount?.currency?.toUpperCase();
  const total = details.amount?.total;
  if (currency && currency !== "GEL") {
    return { ok: true, status: "failed", paymentId: payId };
  }
  if (typeof total === "number" && Math.abs(total - paymentRow.amountGel) >= 0.01) {
    return { ok: true, status: "failed", paymentId: payId };
  }
  if (
    details.merchantPaymentId &&
    details.merchantPaymentId !== paymentRow.id
  ) {
    return { ok: true, status: "failed", paymentId: payId };
  }

  if (!tbcIsPaidStatus(details.status)) {
    if (details.status && /fail|cancel|reject/i.test(details.status)) {
      await markPaymentFailed(payId);
    }
    return { ok: true, status: "failed", paymentId: payId };
  }

  const eventId = paymentRow.eventId;
  if (!eventId) {
    return { ok: true, paymentId: payId, status: "failed" };
  }

  await markPaymentPaid(payId, eventId);
  return { ok: true, eventId, paymentId: payId, status: "paid" };
}

/** Mock checkout completion — not exposed on public webhook routes. */
export async function activateMockTbcPayment(payId: string): Promise<WebhookVerifyResult> {
  const paymentId = payId.replace(/^mock-tbc-/, "");
  const paymentRow = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!paymentRow?.eventId) return { ok: true, paymentId: payId, status: "failed" };
  await markPaymentPaid(payId, paymentRow.eventId);
  return { ok: true, eventId: paymentRow.eventId, paymentId: payId, status: "paid" };
}

/** Mock checkout completion — not exposed on public webhook routes. */
export async function activateMockBogPayment(
  orderId: string,
  externalOrderId: string,
): Promise<WebhookVerifyResult> {
  const payment =
    (await prisma.payment.findUnique({ where: { id: externalOrderId } })) ??
    (await prisma.payment.findFirst({ where: { externalId: orderId, provider: "bog" } }));
  if (!payment?.eventId) {
    return { ok: true, paymentId: orderId, status: "failed" };
  }
  await markPaymentPaid(orderId, payment.eventId);
  return { ok: true, eventId: payment.eventId, paymentId: orderId, status: "paid" };
}
