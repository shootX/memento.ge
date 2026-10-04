import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { verifyMobileOAuthEmailLink } from "@/lib/oauth/mobile-link-flow";

const schema = z.object({
  pendingLinkId: z.string().min(10).max(40),
  email: z.string().email().max(200),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());
    const session = await verifyMobileOAuthEmailLink(
      body.pendingLinkId,
      body.email,
      body.code,
    );
    if (!session) return jsonError(400, "Invalid or expired code");
    return NextResponse.json(session);
  } catch (e) {
    return handleApiError(e);
  }
}
