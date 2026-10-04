import { NextResponse } from "next/server";
import { newToken } from "@/lib/crypto";
import { publicAppUrl } from "@/lib/app-url";
import { createPkcePair } from "@/lib/oauth/pkce";
import { setOAuthFlowCookies } from "@/lib/oauth/flow-cookies";
import {
  oauthRedirectUri,
  safeReturnPath,
  type OAuthProviderId,
} from "@/lib/oauth/redirect-uri";
import { googleAuthUrl } from "@/lib/oauth/providers/google";
import { facebookAuthUrl } from "@/lib/oauth/providers/facebook";
import { appleAuthUrl } from "@/lib/oauth/providers/apple";

function buildAuthUrl(
  provider: OAuthProviderId,
  state: string,
  nonce: string,
  challenge: string,
): string | null {
  switch (provider) {
    case "google":
      return googleAuthUrl({ state, nonce, codeChallenge: challenge });
    case "facebook":
      return facebookAuthUrl({ state, codeChallenge: challenge });
    case "apple":
      return appleAuthUrl({ state, nonce, codeChallenge: challenge });
    default:
      return null;
  }
}

export async function startOAuthFlow(
  provider: OAuthProviderId,
  req: Request,
): Promise<NextResponse> {
  try {
    oauthRedirectUri(provider);
  } catch {
    return NextResponse.redirect(`${publicAppUrl()}/login?oauth=unavailable`);
  }

  const url = new URL(req.url);
  const returnTo = safeReturnPath(url.searchParams.get("returnTo"));
  const state = newToken(16);
  const nonce = newToken(16);
  const { verifier, challenge } = createPkcePair();
  const authUrl = buildAuthUrl(provider, state, nonce, challenge);
  if (!authUrl) {
    return NextResponse.redirect(`${publicAppUrl()}/login?oauth=unavailable`);
  }

  await setOAuthFlowCookies({
    state,
    pkceVerifier: verifier,
    nonce,
    provider,
    returnTo,
  });

  return NextResponse.redirect(authUrl);
}
