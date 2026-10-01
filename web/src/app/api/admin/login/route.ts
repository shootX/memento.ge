import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminSession,
  setAdminCookie,
} from "@/lib/session";
import { clientIp, consumeLogin, jsonError } from "@/lib/api-utils";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
  } catch {
    return jsonError(429, "Too many requests");
  }

  const body = schema.parse(await req.json());
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || body.password !== expected) {
    return jsonError(401, "Invalid password");
  }

  const token = await createAdminSession();
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}
