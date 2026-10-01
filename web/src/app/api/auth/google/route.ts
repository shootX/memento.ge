import { NextResponse } from "next/server";
import { googleAuthUrl } from "@/lib/google-oauth";
import { newToken } from "@/lib/crypto";

export async function GET() {
  const state = newToken(16);
  const url = googleAuthUrl(state);
  if (!url) {
    return NextResponse.json(
      { error: "Google OAuth not configured", stub: true },
      { status: 503 },
    );
  }
  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
