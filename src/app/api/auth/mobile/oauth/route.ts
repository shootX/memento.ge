import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { verifyGoogleIdToken } from "@/lib/oauth/providers/google";
import { verifyAppleIdToken } from "@/lib/oauth/providers/apple";
import {
  completeOAuthVerifiedLogin,
  findUserByOAuth,
} from "@/lib/oauth/link-user";
import { issueMobileSessionResponse } from "@/lib/magic-link-mobile";

const schema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(20).max(8000),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
    const body = schema.parse(await req.json());

    let profile: { sub: string; email: string; name: string | null };
    if (body.provider === "google") {
      profile = await verifyGoogleIdToken(body.idToken);
    } else {
      profile = await verifyAppleIdToken(body.idToken);
    }

    const existing = await findUserByOAuth(body.provider, profile.sub);
    if (existing) {
      const bodyOut = await issueMobileSessionResponse(existing.id);
      return NextResponse.json(bodyOut);
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

    const bodyOut = await issueMobileSessionResponse(result.userId);
    return NextResponse.json(bodyOut);
  } catch (e) {
    return handleApiError(e);
  }
}
