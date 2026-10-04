import { test, expect } from "@playwright/test";

/**
 * Requires dev server started WITHOUT E2E_RATE_LIMIT_FREE=1.
 * CI: covered by tests/password-auth-login-route.test.ts with E2E_RATE_LIMIT_FREE=0.
 */
const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43123";
const strictRate = process.env.PW_STRICT_AUTH_RATE === "1";

test("password login succeeds under real rate limit (no bypass)", async ({ request }) => {
  test.skip(!strictRate, "Set PW_STRICT_AUTH_RATE=1 and start server without E2E_RATE_LIMIT_FREE");

  const email = `strict-${Date.now()}@memento.test`;
  const password = "StrictPass123";
  const csrfRes = await request.get(`${base}/api/auth/csrf`);
  const { csrf } = await csrfRes.json();

  const signup = await request.post(`${base}/api/auth/register`, {
    data: { email, password, passwordConfirm: password, csrf },
  });
  expect(signup.ok()).toBeTruthy();

  const csrf2 = await request.get(`${base}/api/auth/csrf`);
  const { csrf: csrfLogin } = await csrf2.json();
  const login = await request.post(`${base}/api/auth/login`, {
    data: { email, password, csrf: csrfLogin },
  });
  expect(login.status()).toBe(200);
  expect((await login.json()).ok).toBe(true);
});
