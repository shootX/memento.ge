import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSession,
} from "@/lib/session";
import { clientIp, consumeLogin, jsonError } from "@/lib/api-utils";
import { verifyAdminPassword } from "@/lib/admin-auth";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
  } catch {
    return jsonError(429, "Too many requests");
  }

  const body = schema.parse(await req.json());
  if (!(await verifyAdminPassword(body.password))) {
    return jsonError(401, "Invalid password");
  }

  const token = await createAdminSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
