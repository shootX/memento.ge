import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  AUTH_CSRF_COOKIE,
  changeUserPassword,
  consumePasswordResetToken,
  validatePasswordStrength,
  verifyAuthCsrf,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { loginUserWithPassword } from "@/lib/password-auth";

const schema = z.object({
  token: z.string().min(16).max(200),
  password: z.string().min(8).max(200),
  passwordConfirm: z.string().min(8).max(200),
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

    const row = await consumePasswordResetToken(body.token);
    if (!row) return jsonError(400, "Invalid or expired reset link");

    await changeUserPassword(row.userId, body.password);
    await loginUserWithPassword(row.userId);
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (e) {
    return handleApiError(e);
  }
}
