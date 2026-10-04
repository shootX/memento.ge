import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  AUTH_CSRF_COOKIE,
  AuthLockoutError,
  GENERIC_AUTH_ERROR,
  loginUserWithPassword,
  clearLoginFailures,
  recordLoginFailure,
  verifyAuthCsrf,
  verifyUserPasswordLogin,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  csrf: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());
    const jar = await cookies();
    if (!verifyAuthCsrf(jar.get(AUTH_CSRF_COOKIE)?.value, body.csrf)) {
      return jsonError(403, "Invalid CSRF");
    }

    const login = await verifyUserPasswordLogin(body.email, body.password);
    if (!login) {
      await recordLoginFailure(body.email, clientIp(req));
      return jsonError(401, GENERIC_AUTH_ERROR, "INVALID_CREDENTIALS");
    }

    await clearLoginFailures(body.email);
    await loginUserWithPassword(login.userId);
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthLockoutError) {
      return jsonError(429, "Too many attempts", "LOCKED_OUT");
    }
    return handleApiError(e);
  }
}
