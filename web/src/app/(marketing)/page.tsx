import { headers } from "next/headers";
import { LandingV9 } from "@/components/marketing/landing-v9";
import { resolveLandingLocale } from "@/lib/landing-copy";

export const dynamic = "force-dynamic";

/** Marketing home; `/en` and `/ru` are rewritten here with `x-memento-locale`. */
export default async function HomePage() {
  const h = await headers();
  const locale = resolveLandingLocale(h.get("x-memento-locale"));
  return <LandingV9 locale={locale} />;
}
