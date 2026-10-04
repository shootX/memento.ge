import { createRemoteJWKSet, jwtVerify, SignJWT, importPKCS8 } from "jose";
import { oauthRedirectUri } from "@/lib/oauth/redirect-uri";
import { consumeOAuthNonce } from "@/lib/oauth/nonce-store";
import { safeLogWarn } from "@/lib/safe-log";
import { mockAuthorizeUrl, mockOAuthEnabled, takeMockOAuthProfile } from "@/lib/oauth/mock-provider";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export function googleAuthUrl(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "placeholder") return null;
  if (mockOAuthEnabled()) {
    return mockAuthorizeUrl("google", params.state, params.nonce);
  }
  const redirect = oauthRedirectUri("google");
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email profile",
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${q}`;
}

export async function exchangeGoogleCode(params: {
  code: string;
  codeVerifier: string;
  expectedNonce: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const mockProfile = takeMockOAuthProfile(params.code);
  if (mockProfile) {
    if (mockProfile.emailVerified === false) throw new Error("Unverified email");
    const ok = await consumeOAuthNonce(params.expectedNonce);
    if (!ok) throw new Error("Nonce replay");
    return {
      sub: mockProfile.sub,
      email: mockProfile.email,
      name: mockProfile.name,
      picture: undefined,
    };
  }

  const redirect = oauthRedirectUri("google");
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      grant_type: "authorization_code",
      code_verifier: params.codeVerifier,
    }),
  });
  if (!res.ok) {
    safeLogWarn("[oauth/google] token exchange failed");
    throw new Error("Token exchange failed");
  }
  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Missing id_token");

  const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const nonce = payload.nonce;
  if (typeof nonce !== "string" || nonce !== params.expectedNonce) {
    throw new Error("Invalid nonce");
  }
  const ok = await consumeOAuthNonce(nonce);
  if (!ok) throw new Error("Nonce replay");

  const email = payload.email;
  const sub = payload.sub;
  if (typeof email !== "string" || typeof sub !== "string") {
    throw new Error("Invalid profile");
  }
  if (payload.email_verified !== true) {
    throw new Error("Unverified email");
  }

  return {
    sub,
    email,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

export async function verifyGoogleIdToken(idToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google OAuth not configured");
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });
  const email = payload.email;
  const sub = payload.sub;
  if (typeof email !== "string" || typeof sub !== "string") {
    throw new Error("Invalid profile");
  }
  if (payload.email_verified !== true) throw new Error("Unverified email");
  return {
    sub,
    email: email.toLowerCase().trim(),
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
