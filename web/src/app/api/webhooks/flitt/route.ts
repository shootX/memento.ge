import { flittAdapter } from "@/lib/billing/flitt-adapter";
import { webhookIdempotencyKey } from "@/lib/billing/activate-payment";
import { processWebhookDelivery } from "@/lib/billing/webhook-processor";

export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await flittAdapter.verifyWebhook(req, raw);
  if (!verified.ok) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const key = webhookIdempotencyKey("flitt", raw);
  const outcome =
    verified.status === "paid" && verified.paymentId && verified.eventId
      ? "paid"
      : verified.status === "failed"
        ? "failed"
        : "noop";

  return processWebhookDelivery({
    provider: "flitt",
    idempotencyKey: key,
    paymentId: verified.paymentId,
    eventId: verified.eventId,
    outcome,
    expected:
      outcome === "paid"
        ? {
            amountGel: verified.amountGel ?? 0,
            currency: verified.currency ?? "GEL",
            provider: verified.provider ?? "flitt",
          }
        : undefined,
  });
}
