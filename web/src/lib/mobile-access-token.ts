import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/crypto";
import { hashToken } from "@/lib/user-session";

export const MOBILE_ACCESS_TTL_SEC = 30 * 24 * 3600;

export type MobileAuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function createMobileAccessToken(userId: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const accessToken = newToken(32);
  const expiresAt = new Date(Date.now() + MOBILE_ACCESS_TTL_SEC * 1000);
  await prisma.mobileAccessToken.create({
    data: {
      userId,
      tokenHash: hashToken(accessToken),
      expiresAt,
    },
  });
  return { accessToken, expiresIn: MOBILE_ACCESS_TTL_SEC };
}

export function parseBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return m?.[1] ?? null;
}

export async function getUserFromBearerToken(
  token: string | null | undefined,
): Promise<MobileAuthUser | null> {
  if (!token) return null;
  const row = await prisma.mobileAccessToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!row || row.revokedAt || row.expiresAt < new Date()) return null;
  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    role: row.user.role,
  };
}

export async function revokeMobileAccessToken(token: string): Promise<void> {
  await prisma.mobileAccessToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function mobileAuthJson(user: MobileAuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
