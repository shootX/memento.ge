import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUserWithPassword, AUTH_CSRF_COOKIE } from "@/lib/password-auth";
import { POST as loginPost } from "@/app/api/auth/login/route";

const cookiesSet = vi.fn();
const cookiesGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGet, set: cookiesSet, delete: vi.fn() }),
}));

describe("POST /api/auth/login rate limit", () => {
  const email = `route-login-${Date.now()}@memento.test`;
  const password = "RoutePass123";
  const csrfToken = "test-csrf-token-12345678";

  beforeEach(() => {
    cookiesGet.mockImplementation((name: string) =>
      name === AUTH_CSRF_COOKIE ? { value: csrfToken } : undefined,
    );
  });

  afterEach(async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    await prisma.session.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
  });

  it("returns 200 for fresh account with rate limiting enabled", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "0";
    const reg = await registerUserWithPassword({ email, password });
    expect(reg.kind).toBe("created");

    const loginRes = await loginPost(
      new Request("http://127.0.0.1/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, csrf: csrfToken }),
      }),
    );

    expect(loginRes.status).toBe(200);
    const body = await loginRes.json();
    expect(body.ok).toBe(true);
  });
});
