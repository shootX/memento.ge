import { NextResponse } from "next/server";
import { getEventByHostToken } from "@/lib/auth";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";
import { verifyCsrfToken } from "@/lib/crypto";
import { sendPushToEvent, getVapidPublicKey } from "@/lib/push-server";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    if (!getVapidPublicKey()) return jsonError(503, "Push not configured");

    const { token } = await params;
    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    const csrf = req.headers.get("x-csrf-token");
    if (!csrf || !verifyCsrfToken(token, csrf)) return jsonError(403, "CSRF");

    const result = await sendPushToEvent(event.id, {
      title: "Momenti ✨",
      body: "ტესტ შეტყობინება — ყველაფერი მუშაობს!",
      url: `/host/${token}`,
    });

    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
