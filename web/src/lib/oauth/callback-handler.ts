import { NextResponse } from "next/server";
import { publicAppUrl } from "@/lib/app-url";
import { createUserSession, setUserCookie } from "@/lib/user-session";
import { clientIp, consumeLogin } from "@/lib/api-utils";
import {
  clearOAuthFlowCookies,
  readOAuthFlowCookies,
} from "@/lib/oauth/flow-cookies";
import { loginRedirectQuery, safeReturnPath } from "@/lib/oauth/redirect-uri";
import { oauthUserMessages } from "@/lib/oauth/messages";
import {
  completeOAuthVerifiedLogin,
  startFacebookEmailLinkFlow,
} from "@/lib/oauth/link-user";
import { exchangeGoogleCode } from "@/lib/oauth/providers/google";
import { exchangeFacebookCode } from "@/lib/oauth/providers/facebook";
import { exchangeAppleCode } from "@/lib/oauth/providers/apple";
import type { OAuthProviderId } from "@/lib/oauth/redirect-uri";
import { safeLogWarn } from "@/lib/safe-log";

export type OAuthCallbackInput = {
  code: string | null;
  state: string | null;
  error: string | null;
  userJson?: string | null;
};

function redirectToLogin(error: string) {
  return NextResponse.redirect(
    new URL(loginRedirectQuery({ error }), publicAppUrl()),
  );
}

async function finishSession(userId: string, returnTo: string) {
  const session = await createUserSession(userId);
  await setUserCookie(session);
  await clearOAuthFlowCookies();
  return NextResponse.redirect(new URL(safeReturnPath(returnTo), publicAppUrl()));
}

export async function handleOAuthCallback(
  provider: OAuthProviderId,
  req: Request,
  input: OAuthCallbackInput,
): Promise<NextResponse> {
  try {
    await consumeLogin(clientIp(req));
  } catch {
    return redirectToLogin(oauthUserMessages.generic);
  }

  if (input.error === "access_denied") {
    await clearOAuthFlowCookies();
    return redirectToLogin(oauthUserMessages.cancelled);
  }

  const flow = await readOAuthFlowCookies();
  if (!flow || flow.provider !== provider) {
    await clearOAuthFlowCookies();
    return redirectToLogin(oauthUserMessages.stateMismatch);
  }
  if (!input.code || !input.state || input.state !== flow.state) {
    await clearOAuthFlowCookies();
    return redirectToLogin(oauthUserMessages.stateMismatch);
  }

  try {
    if (provider === "google") {
      const profile = await exchangeGoogleCode({
        code: input.code,
        codeVerifier: flow.pkceVerifier,
        expectedNonce: flow.nonce,
      });
      const result = await completeOAuthVerifiedLogin({
        provider: "google",
        providerUserId: profile.sub,
        email: profile.email,
        name: profile.name,
        image: profile.picture,
      });
      if (result.kind === "pending") {
        await clearOAuthFlowCookies();
        return NextResponse.redirect(
          new URL(`/login/oauth-email?pending=${result.pendingToken}`, publicAppUrl()),
        );
      }
      if (result.kind === "session") {
        return finishSession(result.userId, flow.returnTo);
      }
    }

    if (provider === "facebook") {
      const profile = await exchangeFacebookCode({
        code: input.code,
        codeVerifier: flow.pkceVerifier,
      });
      const result = await startFacebookEmailLinkFlow({
        providerUserId: profile.sub,
        name: profile.name,
        image: profile.picture,
        emailFromProvider: profile.email,
      });
      await clearOAuthFlowCookies();
      if (result.kind === "session") {
        return finishSession(result.userId, flow.returnTo);
      }
      return NextResponse.redirect(
        new URL(`/login/oauth-email?pending=${result.pendingToken}`, publicAppUrl()),
      );
    }

    if (provider === "apple") {
      const profile = await exchangeAppleCode({
        code: input.code,
        codeVerifier: flow.pkceVerifier,
        expectedNonce: flow.nonce,
        userJson: input.userJson,
      });
      const result = await completeOAuthVerifiedLogin({
        provider: "apple",
        providerUserId: profile.sub,
        email: profile.email,
        name: profile.name,
      });
      if (result.kind === "pending") {
        await clearOAuthFlowCookies();
        return NextResponse.redirect(
          new URL(`/login/oauth-email?pending=${result.pendingToken}`, publicAppUrl()),
        );
      }
      if (result.kind === "session") {
        return finishSession(result.userId, flow.returnTo);
      }
    }
  } catch (e) {
    safeLogWarn("[oauth] callback failed", e instanceof Error ? e.message : "unknown");
    await clearOAuthFlowCookies();
    return redirectToLogin(oauthUserMessages.generic);
  }

  await clearOAuthFlowCookies();
  return redirectToLogin(oauthUserMessages.generic);
}
