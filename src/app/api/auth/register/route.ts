import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  AUTH_CSRF_COOKIE,
  AuthLockoutError,
  GENERIC_AUTH_ERROR,
  GENERIC_SIGNUP_MESSAGE,
  consumeSignupLimits,
  loginUserWithPassword,
  recordLoginFailure,
  registerUserWithPassword,
  validatePasswordStrength,
  verifyAuthCsrf,
  verifyUserPasswordLogin,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  passwordConfirm: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
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
    if (body.password !== body.passwordConfirm) {
      return jsonError(400, "Passwords do not match");
    }
    const strength = validatePasswordStrength(body.password);
    if (strength) return jsonError(400, "Password too short", strength);

    try {
      await consumeSignupLimits(body.email, clientIp(req));
    } catch {
      return jsonError(429, "Too many requests", "RATE_LIMITED");
    }

    const result = await registerUserWithPassword({
      email: body.email,
      password: body.password,
      name: body.name,
    });

    if (result.kind === "generic") {
      return NextResponse.json({ ok: true, message: GENERIC_SIGNUP_MESSAGE });
    }

    await loginUserWithPassword(result.userId);
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthLockoutError) {
      return jsonError(429, "Too many attempts", "LOCKED_OUT");
    }
    return handleApiError(e);
  }
}
