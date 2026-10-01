import { NextResponse } from "next/server";
import { flittAdapter } from "@/lib/billing/flitt-adapter";
import {
  claimWebhookEvent,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";

export async function POST(req: Request) {
  const raw = await req.text();
  const key = webhookIdempotencyKey("flitt", raw);
  if (!(await claimWebhookEvent("flitt", key))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const verified = await flittAdapter.verifyWebhook(req, raw);
  if (!verified.ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, status: verified.status });
}
