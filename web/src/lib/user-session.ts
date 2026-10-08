import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/crypto";

const USER_COOKIE = "memento_user";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: string): Promise<string> {
  const token = newToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export async function rotateUserSession(userId: string): Promise<string> {
  await prisma.session.deleteMany({ where: { userId } });
  return createUserSession(userId);
}

export async function revokeAllUserAuth(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.mobileAccessToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserFromSession(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  if (!raw) return null;
  const row = await prisma.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!row || row.expiresAt < new Date()) return null;
  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    role: row.user.role,
  };
}

export async function setUserCookie(token: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
}

export async function clearUserCookie() {
  const jar = await cookies();
  jar.delete(USER_COOKIE);
}

export async function requireEventOwner(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [{ ownerUserId: userId }, { coHosts: { some: { userId } } }],
    },
  });
  return event;
}

export async function requirePartnerAccess(partnerId: string, userId: string) {
  return prisma.partnerMember.findFirst({
    where: { partnerId, userId },
    include: { partner: true },
  });
}
