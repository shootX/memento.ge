import { NextResponse } from "next/server";
import { registerMockOAuthCode, mockOAuthEnabled } from "@/lib/oauth/mock-provider";
import { oauthRedirectUri } from "@/lib/oauth/redirect-uri";
import type { OAuthProviderId } from "@/lib/oauth/redirect-uri";
import { newToken } from "@/lib/crypto";

export async function GET(req: Request) {
  if (!mockOAuthEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") as OAuthProviderId | null;
  const state = url.searchParams.get("state");
  const nonce = url.searchParams.get("nonce");
  if (!provider || !state) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const code = `mock_${newToken(8)}`;
  registerMockOAuthCode(code, {
    sub: `mock-${provider}-sub`,
    email: `oauth-mock-${provider}@example.com`,
    name: "Mock User",
    emailVerified: true,
  });

  const callback = new URL(oauthRedirectUri(provider));
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", state);
  if (provider === "google" && nonce) {
    /* nonce validated via cookie flow */
  }
  return NextResponse.redirect(callback.toString());
}
