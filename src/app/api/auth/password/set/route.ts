import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  AUTH_CSRF_COOKIE,
  changeUserPassword,
  validatePasswordStrength,
  verifyAuthCsrf,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { loginUserWithPassword } from "@/lib/password-auth";
import { getUserFromSession } from "@/lib/user-session";

const schema = z.object({
  password: z.string().min(8).max(200),
  passwordConfirm: z.string().min(8).max(200),
  csrf: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const user = await getUserFromSession();
    if (!user) return jsonError(401, "Not signed in");

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

    await changeUserPassword(user.id, body.password);
    await loginUserWithPassword(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
