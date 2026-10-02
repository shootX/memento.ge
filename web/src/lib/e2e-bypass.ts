export function e2eRequestAuthorized(req: Request): boolean {
  const secret = process.env.E2E_SECRET;
  if (!secret) return false;
  return req.headers.get("x-e2e-secret") === secret;
}

export function e2eRateLimitDisabled(): boolean {
  return process.env.E2E_RATE_LIMIT_FREE === "1";
}
