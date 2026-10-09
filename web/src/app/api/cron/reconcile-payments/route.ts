import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { reconcilePendingPayments } from "@/lib/billing/reconcile-payments";

export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await reconcilePendingPayments();
  return NextResponse.json({ ok: true, ...result });
}
