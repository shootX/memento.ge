import { NextResponse } from "next/server";
import { verifyTbcPublicCallbackAuth } from "@/lib/billing/tbc-webhook-auth";
import {
  claimWebhookEvent,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";
import { processSignedTbcCallback } from "@/lib/billing/tbc-public-callback";

export async function handleTbcPaymentCallback(req: Request): Promise<Response> {
  const raw = await req.text();

  if (!verifyTbcPublicCallbackAuth(req, raw)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { PaymentId?: string; paymentId?: string };
  try {
    body = JSON.parse(raw) as { PaymentId?: string; paymentId?: string };
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const payId = body.PaymentId ?? body.paymentId;
  if (!payId || typeof payId !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const key = webhookIdempotencyKey("tbc", raw);
  if (!(await claimWebhookEvent("tbc", key))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const verified = await processSignedTbcCallback(payId);
  if (!verified.ok) {
    return NextResponse.json({ error: "verification failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, status: verified.status });
}
