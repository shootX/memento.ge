import { NextResponse } from "next/server";
import {
  bogCallbackBodyIsValid,
  processSignedBogCallback,
  verifyBogPublicCallbackSignature,
} from "@/lib/billing/bog-public-callback";
import { webhookIdempotencyKey } from "@/lib/billing/activate-payment";
import { processWebhookDelivery } from "@/lib/billing/webhook-processor";

export async function handleBogPaymentCallback(req: Request): Promise<Response> {
  const raw = await req.text();

  if (!verifyBogPublicCallbackSignature(req, raw)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const callback = bogCallbackBodyIsValid(raw);
  if (!callback) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (callback.event && callback.event !== "order_payment") {
    return NextResponse.json({ ok: true });
  }

  const key = webhookIdempotencyKey("bog", raw);
  const verified = await processSignedBogCallback(callback);
  if (!verified.ok) {
    return NextResponse.json({ error: "verification failed" }, { status: 502 });
  }

  const outcome =
    verified.status === "paid" && verified.paymentId && verified.eventId
      ? "paid"
      : verified.status === "failed"
        ? "failed"
        : "noop";

  return processWebhookDelivery({
    provider: "bog",
    idempotencyKey: key,
    paymentId: verified.paymentId,
    eventId: verified.eventId,
    outcome,
    expected:
      outcome === "paid"
        ? {
            amountGel: verified.amountGel ?? 0,
            currency: verified.currency ?? "GEL",
            provider: verified.provider ?? "bog",
          }
        : undefined,
  });
}
