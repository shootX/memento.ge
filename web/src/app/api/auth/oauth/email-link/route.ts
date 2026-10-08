import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/user-session";
import { newToken } from "@/lib/crypto";
import { queueEmail } from "@/lib/email";
import { clientIp, consumeLogin, handleApiError, jsonError } from "@/lib/api-utils";
import { isEmailDeliveryConfigured } from "@/lib/site-config";
import { loadOAuthPending } from "@/lib/oauth/pending-link";
import { buildMagicLinkVerifyUrl } from "@/lib/magic-link-mobile";
import { maskEmail, safeLogInfo } from "@/lib/safe-log";

const schema = z.object({
  email: z.string().email().max(200),
  pending: z.string().min(16).max(200),
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
    const pending = await loadOAuthPending(body.pending);
    if (!pending) return jsonError(400, "Invalid or expired OAuth session");

    const token = newToken(24);
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    const verifyUrl = buildMagicLinkVerifyUrl(token, "web", undefined);

    await prisma.magicLinkToken.create({
      data: {
        email: normalized,
        tokenHash: hashToken(token),
        client: "oauth_link",
        oauthPendingId: pending.id,
        expiresAt,
      },
    });

    await queueEmail(normalized, "magic_link", { verifyUrl });

    if (!isEmailDeliveryConfigured() && process.env.NODE_ENV !== "production") {
      safeLogInfo("[oauth/email-link] queued", maskEmail(normalized));
    }

    return NextResponse.json({
      ok: true,
      warning: !isEmailDeliveryConfigured()
        ? "ელფოსტის გაგზავნა არ არის კონფიგურირებული."
        : undefined,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
