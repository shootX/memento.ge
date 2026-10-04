import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  adminCreatePasswordResetLink,
  changeUserPassword,
  consumePasswordResetToken,
  createPasswordResetToken,
  hashPassword,
  registerUserWithPassword,
  verifyUserPasswordLogin,
  recordLoginFailure,
  assertNotLockedOut,
  AuthLockoutError,
} from "@/lib/password-auth";
import { hashToken } from "@/lib/user-session";

describe("password auth", () => {
  const email = `pwd-${Date.now()}@memento.test`;
  const email2 = `pwd-dup-${Date.now()}@memento.test`;

  afterEach(async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    await prisma.passwordResetToken.deleteMany({
      where: { user: { email: { in: [email, email2] } } },
    });
    await prisma.session.deleteMany({ where: { user: { email: { in: [email, email2] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [email, email2] } } });
  });

  it("signs up and logs in with password", async () => {
    const reg = await registerUserWithPassword({ email, password: "securepass1" });
    expect(reg.kind).toBe("created");
    const login = await verifyUserPasswordLogin(email, "securepass1");
    expect(login?.userId).toBeTruthy();
  });

  it("returns generic result for duplicate email signup", async () => {
    await registerUserWithPassword({ email: email2, password: "securepass1" });
    const again = await registerUserWithPassword({ email: email2, password: "otherpass2" });
    expect(again.kind).toBe("generic");
  });

  it("rejects wrong password with null login", async () => {
    await registerUserWithPassword({ email, password: "securepass1" });
    const login = await verifyUserPasswordLogin(email, "wrongpass1");
    expect(login).toBeNull();
  });

  it("locks out after repeated failures", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "0";
    await registerUserWithPassword({ email, password: "securepass1" });
    for (let i = 0; i < 5; i++) {
      await recordLoginFailure(email, "127.0.0.1");
    }
    await expect(assertNotLockedOut(email)).rejects.toBeInstanceOf(AuthLockoutError);
    process.env.E2E_RATE_LIMIT_FREE = "1";
  });

  it("expires and single-uses reset token", async () => {
    const reg = await registerUserWithPassword({ email, password: "securepass1" });
    if (reg.kind !== "created") throw new Error("setup");
    const raw = await createPasswordResetToken(reg.userId);
    const first = await consumePasswordResetToken(raw);
    expect(first?.userId).toBe(reg.userId);
    const second = await consumePasswordResetToken(raw);
    expect(second).toBeNull();
  });

  it("admin reset link is audit-logged", async () => {
    const reg = await registerUserWithPassword({ email, password: "securepass1" });
    if (reg.kind !== "created") throw new Error("setup");
    const link = await adminCreatePasswordResetLink(undefined, email);
    expect(link?.resetUrl).toContain("reset-password?token=");
    const audit = await prisma.auditLog.findFirst({
      where: { action: "admin.password_reset_link", entityId: reg.userId },
    });
    expect(audit).toBeTruthy();
  });

  it("revokes sessions on password change", async () => {
    const reg = await registerUserWithPassword({ email, password: "securepass1" });
    if (reg.kind !== "created") throw new Error("setup");
    await prisma.session.create({
      data: {
        userId: reg.userId,
        tokenHash: hashToken("old-session"),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    await changeUserPassword(reg.userId, "newpass1234");
    const count = await prisma.session.count({ where: { userId: reg.userId } });
    expect(count).toBe(0);
    const user = await prisma.user.findUnique({ where: { id: reg.userId } });
    expect(user?.passwordHash).toBeTruthy();
    expect(await verifyUserPasswordLogin(email, "newpass1234")).toBeTruthy();
  });
});
