import { NextResponse } from "next/server";
import { processEmailOutbox, queueExpiryReminders } from "@/lib/email/outbox";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "outbox";

  if (mode === "expiry") {
    const queued = await queueExpiryReminders();
    return NextResponse.json({ ok: true, queued });
  }

  const result = await processEmailOutbox(30);
  return NextResponse.json({ ok: true, ...result });
}
