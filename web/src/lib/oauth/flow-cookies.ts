import { cookies } from "next/headers";
import type { OAuthProviderId } from "@/lib/oauth/redirect-uri";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
};

export type OAuthFlowState = {
  state: string;
  pkceVerifier: string;
  nonce: string;
  provider: OAuthProviderId;
  returnTo: string;
};

export async function setOAuthFlowCookies(flow: OAuthFlowState) {
  const jar = await cookies();
  jar.set("oauth_state", flow.state, COOKIE_OPTS);
  jar.set("oauth_pkce", flow.pkceVerifier, COOKIE_OPTS);
  jar.set("oauth_nonce", flow.nonce, COOKIE_OPTS);
  jar.set("oauth_provider", flow.provider, COOKIE_OPTS);
  jar.set("oauth_return", flow.returnTo, COOKIE_OPTS);
}

export async function readOAuthFlowCookies(): Promise<OAuthFlowState | null> {
  const jar = await cookies();
  const state = jar.get("oauth_state")?.value;
  const pkceVerifier = jar.get("oauth_pkce")?.value;
  const nonce = jar.get("oauth_nonce")?.value;
  const provider = jar.get("oauth_provider")?.value as OAuthProviderId | undefined;
  const returnTo = jar.get("oauth_return")?.value ?? "/dashboard";
  if (!state || !pkceVerifier || !nonce || !provider) return null;
  if (provider !== "google" && provider !== "facebook" && provider !== "apple") return null;
  return { state, pkceVerifier, nonce, provider, returnTo };
}

export async function clearOAuthFlowCookies() {
  const jar = await cookies();
  for (const name of [
    "oauth_state",
    "oauth_pkce",
    "oauth_nonce",
    "oauth_provider",
    "oauth_return",
  ]) {
    jar.delete(name);
  }
}
