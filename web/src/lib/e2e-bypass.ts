export function e2eRequestAuthorized(req: Request): boolean {
  const secret = process.env.E2E_SECRET;
  if (!secret) return false;
  return req.headers.get("x-e2e-secret") === secret;
}

import { e2eRateLimitDisabled as prodSafeE2eRateLimit } from "@/lib/production-guards";

export function e2eRateLimitDisabled(): boolean {
  return prodSafeE2eRateLimit();
}
