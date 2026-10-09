import { NextResponse } from "next/server";
import { stripeAdapter } from "@/lib/billing/stripe-adapter";
import { webhookIdempotencyKey } from "@/lib/billing/activate-payment";
import { processWebhookDelivery } from "@/lib/billing/webhook-processor";

export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await stripeAdapter.verifyWebhook(req, raw);
  if (!verified.ok) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const key = webhookIdempotencyKey("stripe", raw);
  const outcome =
    verified.status === "paid" && verified.paymentId && verified.eventId
      ? "paid"
      : verified.status === "failed"
        ? "failed"
        : "noop";

  return processWebhookDelivery({
    provider: "stripe",
    idempotencyKey: key,
    paymentId: verified.paymentId,
    eventId: verified.eventId,
    outcome,
    expected:
      outcome === "paid"
        ? {
            amountGel: verified.amountGel ?? 0,
            currency: verified.currency ?? "GEL",
            provider: verified.provider ?? "stripe",
          }
        : undefined,
  });
}
