import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, getPlan } from "@/lib/plans";

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
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (event.isPaid) return true;

  const plan = getPlan(event.planTier);
  await prisma.event.update({
    where: { id: eventId },
    data: {
      isPaid: true,
      paidAt: new Date(),
      expiresAt: computeExpiresAt(plan),
    },
  });
  return true;
}

export async function markPaymentPaid(
  externalId: string,
  eventId: string,
): Promise<void> {
  await activateEventFromPayment(eventId);
  await prisma.payment.updateMany({
    where: { OR: [{ externalId }, { id: externalId }] },
    data: { status: "paid", eventId },
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
