import { NextResponse } from "next/server";
import { stripeAdapter } from "@/lib/billing/stripe-adapter";
import {
  claimWebhookEvent,
  markPaymentPaid,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";

export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await stripeAdapter.verifyWebhook(req, raw);
  if (!verified.ok) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const key = webhookIdempotencyKey("stripe", raw);
  if (!(await claimWebhookEvent("stripe", key))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (verified.eventId && verified.status === "paid" && verified.paymentId) {
    await markPaymentPaid(verified.paymentId, verified.eventId);
  }

  return NextResponse.json({ ok: true });
}
