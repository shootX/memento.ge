import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { deriveEventSchedule, paidRetentionExpiresAt } from "@/lib/event-schedule";

export function webhookIdempotencyKey(
  provider: string,
  raw: string,
  extra?: string,
): string {
  return createHash("sha256")
    .update(`${provider}:${extra ?? ""}:${raw}`)
    .digest("hex");
}

export async function claimWebhookEvent(
  provider: string,
  idempotencyKey: string,
  paymentId?: string,
): Promise<boolean> {
  try {
    await prisma.paymentWebhookEvent.create({
      data: { provider, idempotencyKey, paymentId },
    });
    return true;
  } catch {
    return false;
  }
}

export async function activateEventFromPayment(eventId: string): Promise<boolean> {
  const plan = getPlan(
    (await prisma.event.findUnique({ where: { id: eventId }, select: { planTier: true } }))
      ?.planTier ?? "starter",
  );
  const schedule = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return { activated: false as const };
    if (event.isPaid) return { activated: true as const };

    const derived = deriveEventSchedule(event.eventDate, plan);
    const expiresAt = paidRetentionExpiresAt(event.eventDate, plan);
    await tx.event.update({
      where: { id: eventId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        expiresAt,
        uploadOpensAt: derived.uploadOpensAt,
        uploadClosesAt: derived.uploadClosesAt,
        galleryExpiresAt: derived.galleryExpiresAt,
        purgeAt: derived.purgeAt,
      },
    });
    return { activated: true as const };
  });
  return schedule.activated;
}

export async function markPaymentPaid(
  externalId: string,
  eventId: string,
  expected?: { amountGel: number; currency: string; provider: string },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { OR: [{ externalId }, { id: externalId }] },
    });
    if (!payment) return;
    if (expected) {
      if (payment.amountGel !== expected.amountGel) throw new Error("PAYMENT_AMOUNT_MISMATCH");
      if (payment.currency !== expected.currency) throw new Error("PAYMENT_CURRENCY_MISMATCH");
      if (payment.provider !== expected.provider) throw new Error("PAYMENT_PROVIDER_MISMATCH");
    }
    if (payment.eventId && payment.eventId !== eventId) {
      throw new Error("PAYMENT_EVENT_MISMATCH");
    }
    if (payment.status === "paid") return;

    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("EVENT_NOT_FOUND");
    const plan = getPlan(event.planTier);
    const derived = deriveEventSchedule(event.eventDate, plan);
    const expiresAt = paidRetentionExpiresAt(event.eventDate, plan);

    if (!event.isPaid) {
      await tx.event.update({
        where: { id: eventId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          expiresAt,
          uploadOpensAt: derived.uploadOpensAt,
          uploadClosesAt: derived.uploadClosesAt,
          galleryExpiresAt: derived.galleryExpiresAt,
          purgeAt: derived.purgeAt,
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "paid", eventId },
    });
  });
}

export async function markPaymentFailed(ref: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { OR: [{ externalId: ref }, { id: ref }] },
    data: { status: "failed" },
  });
}

export function parsePaymentMetadata(
  raw: string | null | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
