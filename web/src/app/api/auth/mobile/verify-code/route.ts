import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import {
  consumeMagicLinkByCode,
  issueMobileSessionResponse,
  upsertUserFromEmail,
} from "@/lib/magic-link-mobile";

const schema = z.object({
  email: z.string().email().max(200),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const { email, code } = schema.parse(await req.json());
    const row = await consumeMagicLinkByCode(email, code);
    if (!row) return jsonError(400, "Invalid or expired code");
    const user = await upsertUserFromEmail(row.email);
    const body = await issueMobileSessionResponse(user.id);
    return NextResponse.json(body);
  } catch (e) {
    return handleApiError(e);
  }
}
