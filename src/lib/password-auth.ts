import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { newToken } from "@/lib/crypto";
import { hashToken, revokeAllUserAuth, rotateUserSession, setUserCookie } from "@/lib/user-session";
import { isEmailDeliveryConfigured } from "@/lib/site-config";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { publicAppUrl } from "@/lib/app-url";
import { queueEmail } from "@/lib/email";
import { auditLog } from "@/lib/audit";

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = "$2b$12$96EDud/I9prtYvOM4g3Jo.b38rsP0mS8yfja.nOlRMzjfyXvVRIJG";

export const GENERIC_AUTH_ERROR = "Wrong email or password";
export const GENERIC_SIGNUP_MESSAGE =
  "If this email is eligible, you can sign in or reset your password.";

const loginFailByEmail = new RateLimiterMemory({ points: 5, duration: 900 });
const loginFailByIp = new RateLimiterMemory({ points: 20, duration: 900 });
const loginLockByEmail = new RateLimiterMemory({ points: 1, duration: 1800 });
const signupByIp = new RateLimiterMemory({ points: 10, duration: 3600 });
const signupByEmail = new RateLimiterMemory({ points: 5, duration: 3600 });

export class AuthLockoutError extends Error {
  constructor() {
    super("Account temporarily locked");
    this.name = "AuthLockoutError";
  }
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "PASSWORD_TOO_SHORT";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function assertNotLockedOut(email: string): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  try {
    await loginLockByEmail.get(`lock:${email.toLowerCase()}`);
    throw new AuthLockoutError();
  } catch (err) {
    if (err instanceof AuthLockoutError) throw err;
  }
}

export async function recordLoginFailure(email: string, ip: string): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  const normalized = email.toLowerCase();
  try {
    await loginFailByEmail.consume(normalized);
  } catch {
    await loginLockByEmail.consume(`lock:${normalized}`);
  }
  try {
    await loginFailByIp.consume(ip);
  } catch {
    /* ip bucket only rate limits, no lock */
  }
}

export async function clearLoginFailures(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  await loginFailByEmail.delete(normalized).catch(() => undefined);
  await loginLockByEmail.delete(`lock:${normalized}`).catch(() => undefined);
}

export async function consumeSignupLimits(email: string, ip: string): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  await signupByIp.consume(ip);
  await signupByEmail.consume(email.toLowerCase());
}

export async function verifyUserPasswordLogin(
  email: string,
  password: string,
): Promise<{ userId: string } | null> {
  const normalized = email.toLowerCase().trim();
  await assertNotLockedOut(normalized);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const match = await verifyPassword(password, hash);
  if (!user?.passwordHash || !match) {
    return null;
  }
  return { userId: user.id };
}

export async function loginUserWithPassword(userId: string): Promise<string> {
  const token = await rotateUserSession(userId);
  await setUserCookie(token);
  return token;
}

export type RegisterResult =
  | { kind: "created"; userId: string }
  | { kind: "generic" };

export async function registerUserWithPassword(opts: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<RegisterResult> {
  const normalized = opts.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return { kind: "generic" };
  }

  const passwordHash = await hashPassword(opts.password);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      name: opts.name?.trim() || null,
      passwordHash,
      passwordUpdatedAt: new Date(),
      emailVerified: null,
    },
  });
  return { kind: "created", userId: user.id };
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordUpdatedAt: new Date() },
  });
  await revokeAllUserAuth(userId);
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = newToken(32);
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt,
    },
  });
  return raw;
}

export async function consumePasswordResetToken(raw: string) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!row || row.consumedAt || row.expiresAt < new Date()) return null;
  await prisma.passwordResetToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return row;
}

export function buildPasswordResetUrl(token: string): string {
  return `${publicAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function requestPasswordResetEmail(email: string): Promise<{ ok: true }> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return { ok: true };

  const raw = await createPasswordResetToken(user.id);
  const verifyUrl = buildPasswordResetUrl(raw);
  if (isEmailDeliveryConfigured()) {
    await queueEmail(normalized, "magic_link", { verifyUrl });
  }
  return { ok: true };
}

export async function adminCreatePasswordResetLink(
  adminUserId: string | undefined,
  targetEmail: string,
): Promise<{ resetUrl: string } | null> {
  const normalized = targetEmail.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return null;
  const raw = await createPasswordResetToken(user.id);
  const resetUrl = buildPasswordResetUrl(raw);
  await auditLog({
    userId: adminUserId,
    action: "admin.password_reset_link",
    entity: "User",
    entityId: user.id,
    metadata: { email: normalized },
  });
  return { resetUrl };
}

export function verifyAuthCsrf(cookieValue: string | undefined, submitted: string | undefined): boolean {
  if (!cookieValue || !submitted) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(submitted);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const AUTH_CSRF_COOKIE = "memento_auth_csrf";
