import type { LandingLocale } from "@/lib/landing-copy";

export function marketingLocaleFromPath(pathname: string): LandingLocale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/ru" || pathname.startsWith("/ru/")) return "ru";
  return "ka";
}

/** Prefix internal app paths with /en or /ru when the user is on a localized marketing URL. */
export function withMarketingLocalePath(pathname: string, path: string): string {
  const locale = marketingLocaleFromPath(pathname);
  return marketingPathForLocale(locale, path);
}

export function marketingPathForLocale(locale: LandingLocale, path: string): string {
  if (locale === "ka") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export function isMarketingHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/en" || pathname === "/ru";
}

export function localeSwitcherHref(pathname: string, target: "/" | "/en" | "/ru"): string {
  if (target === "/") {
    const rest = pathname.replace(/^\/(en|ru)(?=\/|$)/, "") || "/";
    return rest === "/" ? "/" : rest;
  }
  const locale = target === "/en" ? "en" : "ru";
  if (pathname === "/" || pathname === "/en" || pathname === "/ru") return target;
  const rest = pathname.replace(/^\/(en|ru)/, "") || "/";
  return rest === "/" ? target : `/${locale}${rest}`;
}
