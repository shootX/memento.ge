import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/user-session";
import { newToken } from "@/lib/crypto";
import { queueEmail } from "@/lib/email";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { isEmailDeliveryConfigured } from "@/lib/site-config";
import { shouldExposeDevMagicLink } from "@/lib/dev-magic-link";
import { rememberE2eMagicLink } from "@/lib/e2e-magic-link-store";
import { assertAllowedMementoUri } from "@/lib/mobile-uri";
import {
  buildMagicLinkVerifyUrl,
  generateLoginCode,
  hashLoginCode,
} from "@/lib/magic-link-mobile";

const schema = z.object({
  email: z.string().email().max(200),
  client: z.enum(["web", "mobile"]).optional(),
  redirectUri: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
  } catch {
    return jsonError(429, "Too many requests");
  }

  try {
    const body = schema.parse(await req.json());
    const normalized = body.email.toLowerCase().trim();
    const client = body.client ?? "web";

    let redirectUri: string | undefined;
    if (body.redirectUri) {
      const allowed = assertAllowedMementoUri(body.redirectUri);
      if (!allowed) return jsonError(400, "Invalid redirectUri");
      redirectUri = allowed;
    }
    if (client === "mobile" && !redirectUri) {
      return jsonError(400, "redirectUri required for mobile client");
    }

    const token = newToken(24);
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    const loginCode = generateLoginCode();
    const verifyUrl = buildMagicLinkVerifyUrl(token, client, redirectUri);

    await prisma.magicLinkToken.create({
      data: {
        email: normalized,
        tokenHash: hashToken(token),
        codeHash: hashLoginCode(normalized, loginCode),
        client,
        redirectUri: redirectUri ?? null,
        expiresAt,
      },
    });

    rememberE2eMagicLink(normalized, token, verifyUrl, expiresAt);
    await queueEmail(normalized, "magic_link", { verifyUrl, loginCode });

    const emailOk = isEmailDeliveryConfigured();
    if (!emailOk && process.env.NODE_ENV !== "production") {
      console.info("[magic-link] sent to", normalized);
    }

    const exposeDev = shouldExposeDevMagicLink() && !emailOk;

    return NextResponse.json({
      ok: true,
      devLink: exposeDev ? verifyUrl : undefined,
      warning: !emailOk
        ? "ელფოსტის გაგზავნა არ არის კონფიგურირებული."
        : undefined,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
