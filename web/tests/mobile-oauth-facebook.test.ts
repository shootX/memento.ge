import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyFacebookAccessToken } from "@/lib/oauth/providers/facebook";
import {
  startMobileOAuthEmailLink,
  verifyMobileOAuthEmailLink,
} from "@/lib/oauth/mobile-link-flow";
import { prisma } from "@/lib/prisma";
import { findUserByOAuth } from "@/lib/oauth/link-user";

describe("verifyFacebookAccessToken", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.FACEBOOK_APP_ID = "app123";
    process.env.FACEBOOK_APP_SECRET = "sec456";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects when debug_token app_id mismatches", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("debug_token")) {
        return new Response(
          JSON.stringify({ data: { is_valid: true, app_id: "wrong", user_id: "fb1" } }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch ${url}`);
    }) as typeof fetch;

    await expect(verifyFacebookAccessToken("user-token")).rejects.toThrow(/Invalid/);
  });

  it("returns profile when token is valid", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("debug_token")) {
        return new Response(
          JSON.stringify({ data: { is_valid: true, app_id: "app123", user_id: "fb99" } }),
          { status: 200 },
        );
      }
      if (url.includes("/me?")) {
        return new Response(
          JSON.stringify({ id: "fb99", name: "Test User", email: "fb@test.com" }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch ${url}`);
    }) as typeof fetch;

    const profile = await verifyFacebookAccessToken("user-token");
    expect(profile.sub).toBe("fb99");
    expect(profile.email).toBe("fb@test.com");
  });
});

describe("mobile Facebook link flow", () => {
  const email = `fb-mobile-${Date.now()}@memento.test`;
  let pendingId: string;

  afterEach(async () => {
    await prisma.emailOutbox.deleteMany({ where: { toEmail: email } });
    await prisma.oAuthAccount.deleteMany({
      where: { provider: "facebook", providerUserId: "fb-mobile-1" },
    });
    await prisma.oAuthPendingLink.deleteMany({ where: { providerUserId: "fb-mobile-1" } });
    await prisma.magicLinkToken.deleteMany({ where: { email } });
    await prisma.mobileAccessToken.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
  });

  it("start + verify issues session and links OAuthAccount", async () => {
    const pending = await prisma.oAuthPendingLink.create({
      data: {
        tokenHash: "hash",
        provider: "facebook",
        providerUserId: "fb-mobile-1",
        profileName: "FB User",
        expiresAt: new Date(Date.now() + 30 * 60_000),
      },
    });
    pendingId = pending.id;

    const start = await startMobileOAuthEmailLink(pendingId, email);
    expect(start?.ok).toBe(true);

    const row = await prisma.magicLinkToken.findFirst({
      where: { email, oauthPendingId: pendingId },
      orderBy: { createdAt: "desc" },
    });
    expect(row?.codeHash).toBeTruthy();

    const code = "591024";
    const { hashLoginCode } = await import("@/lib/magic-link-mobile");
    await prisma.magicLinkToken.update({
      where: { id: row!.id },
      data: { codeHash: hashLoginCode(email, code) },
    });

    const session = await verifyMobileOAuthEmailLink(pendingId, email, code);
    expect(session?.accessToken.length).toBeGreaterThan(20);

    const linked = await findUserByOAuth("facebook", "fb-mobile-1");
    expect(linked?.email).toBe(email);
  });
});
