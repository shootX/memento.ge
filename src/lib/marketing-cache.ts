/** Marketing paths that may receive CDN/ISR cache headers — never user/session routes. */
const MARKETING_EXACT = new Set([
  "/",
  "/pricing",
  "/faq",
  "/for-partners",
  "/login",
  "/create",
  "/offline",
]);

const MARKETING_LOCALIZED = new Set([
  "/",
  "/pricing",
  "/faq",
  "/for-partners",
  "/login",
  "/create",
  "/offline",
]);

export function isMarketingCachePath(pathname: string): boolean {
  if (MARKETING_EXACT.has(pathname)) return true;
  const locale = pathname.match(/^\/(en|ru)(\/.*)?$/);
  if (!locale) return false;
  const rest = locale[2] ?? "/";
  const normalized = rest === "" ? "/" : rest.replace(/\/$/, "") || "/";
  return MARKETING_LOCALIZED.has(normalized);
}

export const MARKETING_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

export const PRIVATE_PAGE_CACHE_CONTROL = "private, no-store, must-revalidate";

export function stripLocalePrefix(pathname: string): string {
  const m = pathname.match(/^\/(en|ru)(\/.*)?$/);
  if (!m) return pathname;
  const rest = m[2];
  return rest && rest.length > 0 ? rest : "/";
}

/** Paths that must never get marketing s-maxage (session / user data). */
export function isPrivateAppPath(pathname: string): boolean {
  const p = stripLocalePrefix(pathname);
  if (p.startsWith("/api/")) return true;
  if (p.startsWith("/e/")) return true;
  if (p.startsWith("/host/")) return true;
  if (p.startsWith("/slideshow/")) return true;
  if (p.startsWith("/gallery/")) return true;
  if (p.startsWith("/admin")) return true;
  return false;
}
