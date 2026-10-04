import { NextResponse } from "next/server";
import { z } from "zod";
import { adminCreatePasswordResetLink } from "@/lib/password-auth";
import {
  getAdminTokenFromCookies,
  validateAdminSession,
} from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/api-utils";

const schema = z.object({
  email: z.string().email().max(200),
});

export async function POST(req: Request) {
  try {
    const token = await getAdminTokenFromCookies();
    if (!validateAdminSession(token)) return jsonError(401, "Unauthorized");

    const body = schema.parse(await req.json());
    const result = await adminCreatePasswordResetLink(undefined, body.email);
    if (!result) return jsonError(404, "User not found");
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
