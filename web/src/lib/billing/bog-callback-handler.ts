import { NextResponse } from "next/server";
import {
  bogCallbackBodyIsValid,
  processSignedBogCallback,
  verifyBogPublicCallbackSignature,
} from "@/lib/billing/bog-public-callback";
import {
  claimWebhookEvent,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";

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
  if (!(await claimWebhookEvent("bog", key))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const verified = await processSignedBogCallback(callback);
  if (!verified.ok) {
    return NextResponse.json({ error: "verification failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, status: verified.status });
}
