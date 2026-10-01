import { NextResponse } from "next/server";
import { tbcAdapter } from "@/lib/billing/tbc-adapter";
import { jsonError } from "@/lib/api-utils";

/** Fallback status poll — GET /api/payments/tbc/poll?payId= */
export async function GET(req: Request) {
  const payId = new URL(req.url).searchParams.get("payId");
  if (!payId) return jsonError(400, "payId required");
  if (!tbcAdapter.pollPayment) return jsonError(501, "Not configured");

  const result = await tbcAdapter.pollPayment(payId);
  if (!result.ok) return jsonError(400, "poll failed");
  return NextResponse.json(result);
}
