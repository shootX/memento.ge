import { LandingV9 } from "@/components/marketing/landing-v9";
import { resolveLandingLocale } from "@/lib/landing-copy";
import { headers } from "next/headers";

export default async function HomePage() {
  const h = await headers();
  const locale = resolveLandingLocale(h.get("x-memento-locale"));
  return <LandingV9 locale={locale} />;
}
