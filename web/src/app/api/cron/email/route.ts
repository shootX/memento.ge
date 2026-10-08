import { NextResponse } from "next/server";
import { processEmailOutbox, queueExpiryReminders } from "@/lib/email/outbox";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
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
