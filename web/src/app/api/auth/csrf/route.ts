import { NextResponse } from "next/server";
import { newToken } from "@/lib/crypto";
import { AUTH_CSRF_COOKIE } from "@/lib/password-auth";
import { cookieSecureFlag } from "@/lib/production-guards";

export async function GET() {
  const csrf = newToken(16);
  const res = NextResponse.json({ csrf });
  res.cookies.set(AUTH_CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
    secure: cookieSecureFlag(),
  });
  return res;
}
