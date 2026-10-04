import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { startMobileOAuthEmailLink } from "@/lib/oauth/mobile-link-flow";

const schema = z.object({
  pendingLinkId: z.string().min(10).max(40),
  email: z.string().email().max(200),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());
    const result = await startMobileOAuthEmailLink(body.pendingLinkId, body.email);
    if (!result) return jsonError(400, "Invalid or expired pending link");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
