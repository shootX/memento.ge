import type { Metadata } from "next";
import { headers } from "next/headers";
import { ColorfulShell } from "@/components/colorful-shell";
import { SiteHeaderNav } from "@/components/site-header-nav";
import { resolveLandingLocale } from "@/lib/landing-copy";
import { marketingMetadataForPath } from "@/lib/marketing-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = resolveLandingLocale(h.get("x-memento-locale"));
  const pathname = h.get("x-memento-pathname") ?? "/";
  return marketingMetadataForPath(locale, pathname);
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ColorfulShell blobs>
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-[var(--accent-line)]" aria-hidden />
      <div className="relative">
        <SiteHeaderNav />
        {children}
      </div>
    </ColorfulShell>
  );
}
