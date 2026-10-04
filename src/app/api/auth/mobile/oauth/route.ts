import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { verifyGoogleIdToken } from "@/lib/oauth/providers/google";
import { verifyAppleIdToken } from "@/lib/oauth/providers/apple";
import { verifyFacebookAccessToken } from "@/lib/oauth/providers/facebook";
import {
  completeOAuthVerifiedLogin,
  findUserByOAuth,
} from "@/lib/oauth/link-user";
import { createOAuthPendingRecord } from "@/lib/oauth/pending-link";
import { issueMobileSessionResponse } from "@/lib/magic-link-mobile";

const googleAppleSchema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(20).max(8000),
});

const facebookSchema = z.object({
  provider: z.literal("facebook"),
  accessToken: z.string().min(20).max(4000),
});

const schema = z.union([googleAppleSchema, facebookSchema]);

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());

    if (body.provider === "facebook") {
      const profile = await verifyFacebookAccessToken(body.accessToken);
      const existing = await findUserByOAuth("facebook", profile.sub);
      if (existing) {
        return NextResponse.json(await issueMobileSessionResponse(existing.id));
      }

      const pending = await createOAuthPendingRecord({
        provider: "facebook",
        providerUserId: profile.sub,
        profileName: profile.name,
        emailFromProvider: profile.email ?? null,
      });
      return jsonError(
        409,
        "Email verification required to link Facebook account",
        "OAUTH_LINK_REQUIRED",
        { pendingLinkId: pending.id },
      );
    }

    let profile: { sub: string; email: string; name: string | null };
    if (body.provider === "google") {
      profile = await verifyGoogleIdToken(body.idToken);
    } else {
      profile = await verifyAppleIdToken(body.idToken);
    }

    const existing = await findUserByOAuth(body.provider, profile.sub);
    if (existing) {
      return NextResponse.json(await issueMobileSessionResponse(existing.id));
    }

    const result = await completeOAuthVerifiedLogin({
      provider: body.provider,
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name,
    });

    if (result.kind !== "session") {
      return jsonError(
        409,
        "Email verification required — complete sign-in on the web first",
        "OAUTH_LINK_REQUIRED",
      );
    }

    return NextResponse.json(await issueMobileSessionResponse(result.userId));
  } catch (e) {
    return handleApiError(e);
  }
}
