import type { Metadata } from "next";
import type { LandingLocale } from "@/lib/landing-copy";
import { marketingPathForLocale } from "@/lib/marketing-locale-path";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://memento.ge";

export function marketingMetadataForPath(
  locale: LandingLocale,
  pathname: string,
  title?: string,
): Metadata {
  const rest =
    pathname.replace(/^\/(en|ru)(?=\/|$)/, "") === ""
      ? "/"
      : pathname.replace(/^\/(en|ru)/, "") || "/";
  const canonicalPath = marketingPathForLocale(locale, rest === "/" ? "/" : rest);
  const canonical = new URL(canonicalPath, siteUrl).toString();

  const languages: Record<string, string> = {
    ka: new URL(marketingPathForLocale("ka", rest === "/" ? "/" : rest), siteUrl).toString(),
    en: new URL(marketingPathForLocale("en", rest === "/" ? "/" : rest), siteUrl).toString(),
    "x-default": new URL(marketingPathForLocale("ka", rest === "/" ? "/" : rest), siteUrl).toString(),
  };

  return {
    title,
    alternates: {
      canonical,
      languages,
    },
  };
}
