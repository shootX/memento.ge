import type { BogPaymentDetails } from "@/lib/billing/bog-client";
import {
  bogGetPaymentDetails,
  bogOrderStatusFromCallbackBody,
  parseBogCallback,
  verifyBogCallbackSignature,
  type BogCallbackBody,
} from "@/lib/billing/bog-client";
import {
  bogOrderIsPaid,
  bogOrderIsTerminalFailure,
  mapBogOrderStatus,
  normalizeBogOrderStatus,
} from "@/lib/billing/bog-config";
import { prisma } from "@/lib/prisma";
import { markPaymentFailed, markPaymentPaid } from "@/lib/billing/activate-payment";
import type { WebhookVerifyResult } from "@/lib/billing/types";

export function bogCallbackBodyIsValid(raw: string): BogCallbackBody | null {
  if (!raw.trim()) return null;
  const parsed = parseBogCallback(raw);
  if (!parsed) return null;
  if (!parsed.body) return null;
  if (!parsed.body.order_id && !parsed.body.external_order_id) return null;
  return parsed;
}

export function verifyBogPublicCallbackSignature(req: Request, raw: string): boolean {
  const sig = req.headers.get("Callback-Signature");
  return verifyBogCallbackSignature(raw, sig);
}

export function bogReceiptMatchesPayment(
  receipt: BogPaymentDetails & {
    purchase_units?: {
      currency_code?: string;
      request_amount?: string;
      transfer_amount?: string;
    };
  },
  payment: { id: string; amountGel: number },
): boolean {
  const currency = receipt.purchase_units?.currency_code?.toUpperCase();
  if (currency && currency !== "GEL") return false;

  if (receipt.external_order_id && receipt.external_order_id !== payment.id) {
    return false;
  }

  const amountRaw =
    receipt.purchase_units?.transfer_amount ?? receipt.purchase_units?.request_amount;
  const amount = amountRaw != null ? Number.parseFloat(amountRaw) : Number.NaN;
  if (!Number.isFinite(amount)) return false;
  return Math.abs(amount - payment.amountGel) < 0.01;
}

export async function processSignedBogCallback(
  callback: BogCallbackBody,
): Promise<WebhookVerifyResult> {
  if (callback.event && callback.event !== "order_payment") {
    return { ok: true };
  }

  const orderId = callback.body?.order_id;
  const externalOrderId = callback.body?.external_order_id;

  if (!orderId) {
    return { ok: true, status: "failed", paymentId: externalOrderId };
  }

  let receipt: BogPaymentDetails & {
    purchase_units?: {
      currency_code?: string;
      request_amount?: string;
      transfer_amount?: string;
    };
  };
  try {
    receipt = await bogGetPaymentDetails(orderId);
  } catch {
    return { ok: false };
  }

  const receiptStatus = normalizeBogOrderStatus(receipt.order_status);
  const mapped = mapBogOrderStatus(receiptStatus);

  const payment = externalOrderId
    ? await prisma.payment.findUnique({ where: { id: externalOrderId } })
    : receipt.external_order_id
      ? await prisma.payment.findUnique({ where: { id: receipt.external_order_id } })
      : await prisma.payment.findFirst({
          where: { externalId: orderId, provider: "bog" },
        });

  if (mapped === "pending") {
    return { ok: true, paymentId: orderId };
  }

  const ref = orderId ?? externalOrderId ?? payment?.id;

  if (!payment || !bogReceiptMatchesPayment(receipt, payment)) {
    return { ok: true, status: "failed", paymentId: orderId };
  }

  if (mapped === "failed" || bogOrderIsTerminalFailure(receiptStatus)) {
    if (ref) await markPaymentFailed(ref);
    return { ok: true, status: "failed", paymentId: orderId };
  }

  if (!bogOrderIsPaid(receiptStatus)) {
    return { ok: true, status: "failed", paymentId: orderId };
  }

  const eventId = payment.eventId;
  if (!eventId) {
    return { ok: true, paymentId: orderId, status: "failed" };
  }

  await markPaymentPaid(orderId, eventId);
  return {
    ok: true,
    eventId,
    paymentId: orderId,
    status: "paid",
  };
}

/** @deprecated callback status hint — receipt is source of truth in processSignedBogCallback */
export function bogCallbackStatusHint(callback: BogCallbackBody): string | undefined {
  return bogOrderStatusFromCallbackBody(callback.body);
}
