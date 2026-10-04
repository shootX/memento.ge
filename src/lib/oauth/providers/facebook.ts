import { oauthRedirectUri } from "@/lib/oauth/redirect-uri";
import { safeLogWarn } from "@/lib/safe-log";

const FB_AUTH = "https://www.facebook.com/v21.0/dialog/oauth";
const FB_TOKEN = "https://graph.facebook.com/v21.0/oauth/access_token";
const FB_GRAPH = "https://graph.facebook.com/v21.0/me";

export function facebookAuthUrl(params: {
  state: string;
  codeChallenge: string;
}): string | null {
  const clientId = process.env.FACEBOOK_APP_ID;
  if (!clientId) return null;
  const redirect = oauthRedirectUri("facebook");
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: "email,public_profile",
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${FB_AUTH}?${q}`;
}

export async function exchangeFacebookCode(params: { code: string; codeVerifier: string }) {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  if (!clientId || !clientSecret) throw new Error("Facebook OAuth not configured");

  const redirect = oauthRedirectUri("facebook");
  const tokenUrl = new URL(FB_TOKEN);
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirect);
  tokenUrl.searchParams.set("code", params.code);
  tokenUrl.searchParams.set("code_verifier", params.codeVerifier);

  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) {
    safeLogWarn("[oauth/facebook] token exchange failed");
    throw new Error("Token exchange failed");
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("Missing access_token");

  const profileUrl = new URL(FB_GRAPH);
  profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  profileUrl.searchParams.set("access_token", tokens.access_token);

  const profileRes = await fetch(profileUrl);
  if (!profileRes.ok) throw new Error("Profile fetch failed");
  const profile = (await profileRes.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };
  if (!profile.id) throw new Error("Invalid profile");

  return {
    sub: profile.id,
    email: profile.email?.toLowerCase().trim(),
    name: profile.name,
    picture: profile.picture?.data?.url,
  };
}

const FB_DEBUG = "https://graph.facebook.com/v21.0/debug_token";

export async function verifyFacebookAccessToken(userAccessToken: string) {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  if (!clientId || !clientSecret) throw new Error("Facebook OAuth not configured");

  const appAccessToken = `${clientId}|${clientSecret}`;
  const debugUrl = new URL(FB_DEBUG);
  debugUrl.searchParams.set("input_token", userAccessToken);
  debugUrl.searchParams.set("access_token", appAccessToken);

  const debugRes = await fetch(debugUrl);
  if (!debugRes.ok) {
    safeLogWarn("[oauth/facebook] debug_token failed");
    throw new Error("Invalid access token");
  }
  const debugBody = (await debugRes.json()) as {
    data?: { app_id?: string; is_valid?: boolean; user_id?: string };
  };
  const data = debugBody.data;
  if (!data?.is_valid || data.app_id !== clientId || !data.user_id) {
    throw new Error("Invalid access token");
  }

  const profileUrl = new URL(FB_GRAPH);
  profileUrl.searchParams.set("fields", "id,name,email");
  profileUrl.searchParams.set("access_token", userAccessToken);

  const profileRes = await fetch(profileUrl);
  if (!profileRes.ok) throw new Error("Profile fetch failed");
  const profile = (await profileRes.json()) as {
    id?: string;
    name?: string;
    email?: string;
  };
  if (!profile.id || profile.id !== data.user_id) throw new Error("Invalid profile");

  return {
    sub: profile.id,
    email: profile.email?.toLowerCase().trim(),
    name: profile.name ?? null,
  };
}
