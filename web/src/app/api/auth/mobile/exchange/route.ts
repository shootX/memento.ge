import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import {
  consumeMagicLinkByToken,
  issueMobileSessionResponse,
  upsertUserFromEmail,
} from "@/lib/magic-link-mobile";

const schema = z.object({
  token: z.string().min(16).max(200),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const { token } = schema.parse(await req.json());
    const row = await consumeMagicLinkByToken(token);
    if (!row) return jsonError(400, "Invalid or expired token");
    const user = await upsertUserFromEmail(row.email);
    const body = await issueMobileSessionResponse(user.id);
    return NextResponse.json(body);
  } catch (e) {
    return handleApiError(e);
  }
}
