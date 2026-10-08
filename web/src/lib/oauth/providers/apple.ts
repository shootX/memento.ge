import { createHash } from "crypto";
import { importPKCS8, SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { oauthRedirectUri } from "@/lib/oauth/redirect-uri";
import { consumeOAuthNonce } from "@/lib/oauth/nonce-store";
import { safeLogWarn } from "@/lib/safe-log";

const APPLE_AUTH = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN = "https://appleid.apple.com/auth/token";
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function normalizeApplePrivateKey(): string | null {
  const raw = process.env.APPLE_PRIVATE_KEY;
  if (!raw) return null;
  if (raw.includes("BEGIN PRIVATE KEY")) return raw.replace(/\\n/g, "\n");
  return `-----BEGIN PRIVATE KEY-----\n${raw.replace(/\\n/g, "\n")}\n-----END PRIVATE KEY-----`;
}

export function isAppleOAuthConfigured(): boolean {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      normalizeApplePrivateKey(),
  );
}

async function appleClientSecret(): Promise<string> {
  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKeyPem = normalizeApplePrivateKey();
  if (!clientId || !teamId || !keyId || !privateKeyPem) {
    throw new Error("Apple OAuth not configured");
  }
  const key = await importPKCS8(privateKeyPem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 86400 * 180)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);
}

export function appleAuthUrl(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): string | null {
  if (!isAppleOAuthConfigured()) return null;
  const clientId = process.env.APPLE_CLIENT_ID!;
  const redirect = oauthRedirectUri("apple");
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${APPLE_AUTH}?${q}`;
}

export function parseAppleFirstLoginName(userJson?: string | null): string | undefined {
  if (!userJson) return undefined;
  try {
    const user = JSON.parse(userJson) as {
      name?: { firstName?: string; lastName?: string };
    };
    const parts = [user.name?.firstName, user.name?.lastName].filter(Boolean);
    if (parts.length) return parts.join(" ");
  } catch {
    /* ignore */
  }
  return undefined;
}

export async function exchangeAppleCode(params: {
  code: string;
  codeVerifier: string;
  expectedNonce: string;
  userJson?: string | null;
}) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) throw new Error("Apple OAuth not configured");
  const redirect = oauthRedirectUri("apple");
  const clientSecret = await appleClientSecret();

  const res = await fetch(APPLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      redirect_uri: redirect,
      grant_type: "authorization_code",
      code_verifier: params.codeVerifier,
    }),
  });
  if (!res.ok) {
    safeLogWarn("[oauth/apple] token exchange failed");
    throw new Error("Token exchange failed");
  }
  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Missing id_token");

  const { payload } = await jwtVerify(tokens.id_token, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });

  const nonce = payload.nonce;
  if (typeof nonce !== "string" || nonce !== params.expectedNonce) {
    throw new Error("Invalid nonce");
  }
  const ok = await consumeOAuthNonce(nonce);
  if (!ok) throw new Error("Nonce replay");

  const sub = payload.sub;
  if (typeof sub !== "string") throw new Error("Invalid profile");

  const email =
    typeof payload.email === "string" ? payload.email.toLowerCase().trim() : undefined;
  const isPrivateEmail = payload.is_private_email === true || email?.endsWith("@privaterelay.appleid.com");

  const name: string | undefined = parseAppleFirstLoginName(params.userJson);

  if (!email) {
    throw new Error("Missing email");
  }

  return {
    sub,
    email,
    name,
    isPrivateEmail,
  };
}

export async function verifyAppleIdToken(idToken: string) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) throw new Error("Apple OAuth not configured");
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });
  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid profile");
  }
  return {
    sub,
    email: email.toLowerCase().trim(),
    name: null as string | null,
  };
}

/** Stable hash for relay emails when comparing accounts */
export function appleEmailFingerprint(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16);
}
