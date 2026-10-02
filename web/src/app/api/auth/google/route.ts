import { NextResponse } from "next/server";
import { googleAuthUrl } from "@/lib/google-oauth";
import { newToken } from "@/lib/crypto";
import { publicAppUrl } from "@/lib/app-url";

export async function GET() {
  const state = newToken(16);
  const url = googleAuthUrl(state);
  if (!url) {
    return NextResponse.redirect(`${publicAppUrl()}/login?oauth=unavailable`);
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
