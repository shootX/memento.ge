import { NextResponse } from "next/server";
import { clientIp, consumeApi, jsonError } from "@/lib/api-utils";

/** Legacy manual-payment seam — disabled; use host checkout or billing APIs. */
export async function POST(req: Request) {
  await consumeApi(clientIp(req));
  return jsonError(410, "Endpoint removed — use /api/host/:token/checkout");
}
