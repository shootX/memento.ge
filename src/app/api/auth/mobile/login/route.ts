import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthLockoutError,
  GENERIC_AUTH_ERROR,
  recordLoginFailure,
  verifyUserPasswordLogin,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { issueMobileSessionResponse } from "@/lib/magic-link-mobile";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());
    const login = await verifyUserPasswordLogin(body.email, body.password);
    if (!login) {
      await recordLoginFailure(body.email, clientIp(req));
      return jsonError(401, GENERIC_AUTH_ERROR, "INVALID_CREDENTIALS");
    }
    const out = await issueMobileSessionResponse(login.userId);
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof AuthLockoutError) {
      return jsonError(429, "Too many attempts", "LOCKED_OUT");
    }
    return handleApiError(e);
  }
}
