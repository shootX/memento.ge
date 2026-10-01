import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/crypto";

const ADMIN_COOKIE = "momenti_admin";
const HOST_CSRF_COOKIE = "momenti_host_csrf";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(): Promise<string> {
  const token = newToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.adminSession.create({
    data: { tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export async function validateAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.expiresAt < new Date()) return false;
  return true;
}

export async function getAdminTokenFromCookies(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value;
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function setHostCsrf(hostToken: string) {
  const jar = await cookies();
  jar.set(HOST_CSRF_COOKIE, hostToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 3600,
  });
}

export async function verifyHostCsrf(
  hostToken: string,
  csrfHeader: string | null,
): Promise<boolean> {
  if (!csrfHeader) return false;
  const jar = await cookies();
  const cookieVal = jar.get(HOST_CSRF_COOKIE)?.value;
  if (cookieVal !== hostToken) return false;
  const { verifyCsrfToken } = await import("@/lib/crypto");
  return verifyCsrfToken(hostToken, csrfHeader);
}
