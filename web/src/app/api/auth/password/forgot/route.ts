import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  AUTH_CSRF_COOKIE,
  requestPasswordResetEmail,
  verifyAuthCsrf,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { isEmailDeliveryConfigured } from "@/lib/site-config";

const schema = z.object({
  email: z.string().email().max(200),
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

    if (!isEmailDeliveryConfigured()) {
      return jsonError(
        503,
        "Email is not configured — contact support or use admin reset",
        "EMAIL_NOT_CONFIGURED",
      );
    }

    await requestPasswordResetEmail(body.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
