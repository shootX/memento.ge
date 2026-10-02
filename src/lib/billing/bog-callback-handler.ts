import { NextResponse } from "next/server";
import { bogAdapter } from "@/lib/billing/bog-adapter";
import {
  claimWebhookEvent,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";

export async function handleBogPaymentCallback(req: Request): Promise<Response> {
  const raw = await req.text();
  const key = webhookIdempotencyKey("bog", raw);
  if (!(await claimWebhookEvent("bog", key))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const verified = await bogAdapter.verifyWebhook(req, raw);
  if (!verified.ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, status: verified.status });
}
