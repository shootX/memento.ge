import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/user-session";
import {
  createMobileAccessToken,
  mobileAuthJson,
  MOBILE_ACCESS_TTL_SEC,
} from "@/lib/mobile-access-token";
import { assertAllowedMementoUri } from "@/lib/mobile-uri";
import { publicAppUrl } from "@/lib/app-url";

export function generateLoginCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export function hashLoginCode(email: string, code: string): string {
  return hashToken(`mobile-code:${email.toLowerCase()}:${code}`);
}

export function buildMagicLinkVerifyUrl(
  token: string,
  client: string | undefined,
  redirectUri: string | undefined,
): string {
  if (client === "mobile" && redirectUri) {
    const allowed = assertAllowedMementoUri(redirectUri);
    if (allowed) {
      const u = new URL(allowed);
      u.searchParams.set("token", token);
      return u.toString();
    }
  }
  return `${publicAppUrl()}/api/auth/verify?token=${token}`;
}

export async function upsertUserFromEmail(email: string) {
  const normalized = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: normalized, emailVerified: new Date() },
    });
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }
  return user;
}

export async function consumeMagicLinkByToken(rawToken: string) {
  const row = await prisma.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!row || row.consumedAt || row.expiresAt < new Date()) return null;
  await prisma.magicLinkToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return row;
}

export async function consumeMagicLinkByCode(email: string, code: string) {
  const normalized = email.toLowerCase().trim();
  if (!/^\d{6}$/.test(code)) return null;
  const row = await prisma.magicLinkToken.findFirst({
    where: {
      email: normalized,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      codeHash: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row?.codeHash || row.codeHash !== hashLoginCode(normalized, code)) return null;
  await prisma.magicLinkToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return row;
}

export async function issueMobileSessionResponse(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { accessToken, expiresIn } = await createMobileAccessToken(userId);
  return {
    accessToken,
    expiresIn,
    user: mobileAuthJson({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }),
  };
}

export { MOBILE_ACCESS_TTL_SEC };
