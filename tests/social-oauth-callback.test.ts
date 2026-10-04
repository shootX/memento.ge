import { describe, expect, it, vi, beforeEach } from "vitest";
import { oauthUserMessages, oauthErrorMessageKa } from "@/lib/oauth/messages";
import { completeOAuthVerifiedLogin, startFacebookEmailLinkFlow } from "@/lib/oauth/link-user";
import { consumeOAuthNonce } from "@/lib/oauth/nonce-store";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccount: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    oAuthPendingLink: {
      create: vi.fn(),
    },
    oAuthNonce: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("oauth messages", () => {
  it("returns Georgian copy for cancelled login", () => {
    expect(oauthErrorMessageKa(oauthUserMessages.cancelled)).toContain("გაუქმდა");
  });

  it("returns message for state mismatch", () => {
    expect(oauthErrorMessageKa(oauthUserMessages.stateMismatch)).toBeTruthy();
  });
});

describe("oauth account linking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("links google to existing verified user by email", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "a@example.com",
      emailVerified: new Date(),
      name: "Ann",
      image: null,
      role: "user",
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.oAuthAccount.upsert).mockResolvedValue({} as never);

    const result = await completeOAuthVerifiedLogin({
      provider: "google",
      providerUserId: "g-sub",
      email: "a@example.com",
    });
    expect(result.kind).toBe("session");
    if (result.kind === "session") expect(result.userId).toBe("u1");
  });

  it("does not auto-link when email exists but is unverified", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u2",
      email: "b@example.com",
      emailVerified: null,
      name: null,
      image: null,
      role: "user",
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.oAuthPendingLink.create).mockResolvedValue({
      id: "p1",
    } as never);

    const result = await completeOAuthVerifiedLogin({
      provider: "google",
      providerUserId: "g2",
      email: "b@example.com",
    });
    expect(result.kind).toBe("pending");
  });

  it("facebook always requires email verification flow for new link", async () => {
    vi.mocked(prisma.oAuthAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.oAuthPendingLink.create).mockResolvedValue({ id: "fp1" } as never);
    const result = await startFacebookEmailLinkFlow({
      providerUserId: "fb1",
      emailFromProvider: "fb@example.com",
    });
    expect(result.kind).toBe("need_email");
  });
});

describe("oauth nonce replay", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects replayed nonce", async () => {
    vi.mocked(prisma.oAuthNonce.findUnique).mockResolvedValue({ id: "n1" } as never);
    const ok = await consumeOAuthNonce("same-nonce");
    expect(ok).toBe(false);
  });
});
