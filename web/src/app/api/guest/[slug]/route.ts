import { NextResponse } from "next/server";
import { buildGuestEventPayload } from "@/lib/guest-event-payload";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { slug } = await params;
    const guestKey = new URL(req.url).searchParams.get("guestKey");
    const payload = await buildGuestEventPayload(slug, guestKey);
    if (!payload) return jsonError(404, "Not found");
    return NextResponse.json(payload);
  } catch (e) {
    return handleApiError(e);
  }
}
