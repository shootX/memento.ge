import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { markPaymentFailed, markPaymentPaid } from "@/lib/billing/activate-payment";

const LEASE_MS = 30_000;
const MAX_ATTEMPTS = 12;

export type WebhookDeliveryInput = {
  provider: string;
  idempotencyKey: string;
  paymentId?: string;
  eventId?: string;
  outcome: "paid" | "failed" | "noop";
  expected?: { amountGel: number; currency: string; provider: string };
};

let testFailPaymentOnce: string | null = null;

export function setWebhookTestFailOnceForPayment(paymentId: string | null) {
  testFailPaymentOnce = paymentId;
}

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

function isRetryableProcessingError(e: unknown): boolean {
  if (e instanceof Error && e.message === "WEBHOOK_DB_UNAVAILABLE") return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1008", "P1017"].includes(e.code);
  }
  return false;
}

async function acquireLease(
  input: WebhookDeliveryInput,
): Promise<
  | { kind: "duplicate" }
  | { kind: "acquired"; rowId: string }
  | { kind: "retry_later" }
> {
  if (process.env.WEBHOOK_TEST_FORCE_DB_ERROR === "1") {
    throw new Error("WEBHOOK_DB_UNAVAILABLE");
  }

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });

  if (existing?.status === "succeeded") {
    return { kind: "duplicate" };
  }

  if (
    existing?.status === "processing" &&
    existing.leaseUntil &&
    existing.leaseUntil > new Date()
  ) {
    return { kind: "duplicate" };
  }

  if (!existing) {
    try {
      const created = await prisma.paymentWebhookEvent.create({
        data: {
          provider: input.provider,
          idempotencyKey: input.idempotencyKey,
          paymentId: input.paymentId,
          status: "processing",
          leaseUntil: new Date(Date.now() + LEASE_MS),
          attempts: 1,
        },
      });
      return { kind: "acquired", rowId: created.id };
    } catch (e) {
      if (isUniqueViolation(e)) {
        return { kind: "duplicate" };
      }
      throw e;
    }
  }

  if (existing.attempts >= MAX_ATTEMPTS && existing.status === "failed") {
    return { kind: "duplicate" };
  }

  const renewed = await prisma.paymentWebhookEvent.updateMany({
    where: {
      id: existing.id,
      OR: [
        { status: { in: ["received", "failed"] } },
        {
          status: "processing",
          leaseUntil: { lt: new Date() },
        },
      ],
    },
    data: {
      status: "processing",
      leaseUntil: new Date(Date.now() + LEASE_MS),
      attempts: { increment: 1 },
      paymentId: input.paymentId ?? existing.paymentId,
    },
  });

  if (renewed.count !== 1) {
    return { kind: "retry_later" };
  }
  return { kind: "acquired", rowId: existing.id };
}

export async function processWebhookDelivery(
  input: WebhookDeliveryInput,
): Promise<Response> {
  try {
    const lease = await acquireLease(input);
    if (lease.kind === "duplicate") {
      return Response.json({ ok: true, duplicate: true });
    }
    if (lease.kind === "retry_later") {
      return Response.json({ error: "in progress" }, { status: 503 });
    }

    if (input.outcome === "noop") {
      await prisma.paymentWebhookEvent.update({
        where: { id: lease.rowId },
        data: {
          status: "succeeded",
          leaseUntil: null,
          processedAt: new Date(),
        },
      });
      return Response.json({ ok: true });
    }

    try {
      if (input.outcome === "paid") {
        if (!input.paymentId || !input.eventId || !input.expected) {
          throw new Error("WEBHOOK_INCOMPLETE");
        }
        if (testFailPaymentOnce === input.paymentId) {
          testFailPaymentOnce = null;
          throw new Error("WEBHOOK_DB_UNAVAILABLE");
        }
        await markPaymentPaid(input.paymentId, input.eventId, input.expected);
      } else if (input.outcome === "failed" && input.paymentId) {
        await markPaymentFailed(input.paymentId);
      }

      await prisma.paymentWebhookEvent.update({
        where: { id: lease.rowId },
        data: {
          status: "succeeded",
          leaseUntil: null,
          processedAt: new Date(),
          lastError: null,
        },
      });
      return Response.json({ ok: true });
    } catch (e) {
      const retryable = isRetryableProcessingError(e);
      await prisma.paymentWebhookEvent.update({
        where: { id: lease.rowId },
        data: {
          status: "failed",
          leaseUntil: null,
          lastError: (e instanceof Error ? e.message : String(e)).slice(0, 500),
        },
      });
      if (retryable) {
        return Response.json({ error: "retryable" }, { status: 503 });
      }
      return Response.json({ error: "processing failed" }, { status: 400 });
    }
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === "WEBHOOK_DB_UNAVAILABLE" || isRetryableProcessingError(e))
    ) {
      return Response.json({ error: "db unavailable" }, { status: 503 });
    }
    throw e;
  }
}
