import { NextResponse } from "next/server";
import { tbcAdapter } from "@/lib/billing/tbc-adapter";
import {
  claimWebhookEvent,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";

export async function POST(req: Request) {
  const raw = await req.text();
  const key = webhookIdempotencyKey("tbc", raw);
  if (!(await claimWebhookEvent("tbc", key))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const verified = await tbcAdapter.verifyWebhook(req, raw);
  if (!verified.ok) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: verified.status });
}
