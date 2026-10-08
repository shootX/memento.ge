import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GENERIC_SIGNUP_MESSAGE,
  consumeSignupLimits,
  registerUserWithPassword,
  validatePasswordStrength,
} from "@/lib/password-auth";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { issueMobileSessionResponse } from "@/lib/magic-link-mobile";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());
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
      return jsonError(409, GENERIC_SIGNUP_MESSAGE, "SIGNUP_UNAVAILABLE");
    }

    const out = await issueMobileSessionResponse(result.userId);
    return NextResponse.json(out);
  } catch (e) {
    return handleApiError(e);
  }
}
