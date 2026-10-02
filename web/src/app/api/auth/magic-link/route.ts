import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/user-session";
import { newToken } from "@/lib/crypto";
import { queueEmail } from "@/lib/email";
import { publicAppUrl } from "@/lib/app-url";
import { clientIp, consumeLogin, jsonError } from "@/lib/api-utils";
import { isEmailDeliveryConfigured } from "@/lib/site-config";
import { shouldExposeDevMagicLink } from "@/lib/dev-magic-link";

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request) {
  try {
    await consumeLogin(clientIp(req));
  } catch {
    return jsonError(429, "Too many requests");
  }

  const { email } = schema.parse(await req.json());
  const normalized = email.toLowerCase().trim();
  const token = newToken(24);
  const expiresAt = new Date(Date.now() + 15 * 60_000);

  await prisma.magicLinkToken.create({
    data: {
      email: normalized,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  const verifyUrl = `${publicAppUrl()}/api/auth/verify?token=${token}`;
  await queueEmail(normalized, "magic_link", { verifyUrl });

  const emailOk = isEmailDeliveryConfigured();
  if (!emailOk) {
    console.info("[magic-link]", normalized, verifyUrl);
  }

  const exposeDev = shouldExposeDevMagicLink() && !emailOk;

  return NextResponse.json({
    ok: true,
    devLink: exposeDev ? verifyUrl : undefined,
    warning: !emailOk
      ? "ელფოსტის გაგზავნა არ არის კონფიგურირებული."
      : undefined,
  });
}
