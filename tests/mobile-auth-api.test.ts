import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/user-session";
import { newToken } from "@/lib/crypto";
import {
  consumeMagicLinkByCode,
  consumeMagicLinkByToken,
  hashLoginCode,
  issueMobileSessionResponse,
} from "@/lib/magic-link-mobile";
import { getUserFromBearerToken } from "@/lib/mobile-access-token";

describe("mobile magic link auth", () => {
  const email = `mobile-${Date.now()}@memento.test`;
  let userId: string;

  afterAll(async () => {
    await prisma.mobileAccessToken.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.magicLinkToken.deleteMany({ where: { email } });
  });

  it("verify-code and exchange are single-use", async () => {
    const raw = newToken(24);
    const code = "482913";
    await prisma.magicLinkToken.create({
      data: {
        email,
        tokenHash: hashToken(raw),
        codeHash: hashLoginCode(email, code),
        client: "mobile",
        redirectUri: "memento://auth/callback",
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });

    const rowCode = await consumeMagicLinkByCode(email, code);
    expect(rowCode?.email).toBe(email);

    const again = await consumeMagicLinkByCode(email, code);
    expect(again).toBeNull();

    const raw2 = newToken(24);
    await prisma.magicLinkToken.create({
      data: {
        email,
        tokenHash: hashToken(raw2),
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });
    const rowTok = await consumeMagicLinkByToken(raw2);
    expect(rowTok?.email).toBe(email);
    expect(await consumeMagicLinkByToken(raw2)).toBeNull();
  });

  it("issues bearer token accepted by getUserFromBearerToken", async () => {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, emailVerified: new Date() } });
    }
    userId = user.id;
    const session = await issueMobileSessionResponse(user.id);
    expect(session.accessToken.length).toBeGreaterThan(20);
    expect(session.expiresIn).toBe(2592000);
    const fromBearer = await getUserFromBearerToken(session.accessToken);
    expect(fromBearer?.email).toBe(email);
  });
});
