"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { MarketingLocaleSwitcher } from "@/components/marketing-locale-switcher";
import { getLandingCopy } from "@/lib/landing-copy";
import {
  isMarketingHomePath,
  marketingLocaleFromPath,
  withMarketingLocalePath,
} from "@/lib/marketing-locale-path";

export function SiteHeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const homeHero = isMarketingHomePath(pathname);
  const locale = marketingLocaleFromPath(pathname);
  const c = getLandingCopy(locale);

  const links = useMemo(
    () => [
      { href: withMarketingLocalePath(pathname, "/pricing"), label: c.navPricing },
      { href: withMarketingLocalePath(pathname, "/for-partners"), label: c.navPartners },
      { href: withMarketingLocalePath(pathname, "/faq"), label: c.navFaq },
    ],
    [pathname, c.navPricing, c.navPartners, c.navFaq],
  );

  const linkClass = homeHero
    ? "text-white/90 hover:text-white"
    : "text-[var(--fg)] hover:text-[var(--accent)]";

  return (
    <>
      <header
        className={cn(
          "top-[3px] z-50",
          homeHero
            ? "absolute left-0 right-0 border-0 bg-transparent"
            : "sticky border-b border-[var(--border-soft)] bg-[var(--bg)]/90 backdrop-blur-md",
        )}
      >
        <div className="container-page flex items-center justify-between py-4 md:py-5">
          <Link
            href={withMarketingLocalePath(pathname, "/")}
            className={cn(
              "font-display text-lg font-extrabold tracking-tight md:text-xl",
              homeHero ? "text-white" : "text-[var(--fg)]",
            )}
          >
            {c.wordmark}
            <span className="text-[var(--accent)]">.</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cn("transition", linkClass)}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <MarketingLocaleSwitcher className={homeHero ? "hidden sm:flex" : "hidden md:flex"} dark={homeHero} />
            <Link
              href={withMarketingLocalePath(pathname, "/login")}
              className={cn(
                "text-sm font-semibold transition",
                homeHero ? "text-white/85 hover:text-white" : "text-[var(--fg)] hover:text-[var(--accent)]",
              )}
              data-testid="nav-login"
            >
              {c.login}
            </Link>
            <Link
              href={withMarketingLocalePath(pathname, "/signup")}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm font-bold transition sm:px-4 sm:py-2",
                homeHero
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)]",
              )}
              data-testid="nav-signup"
            >
              {c.navSignup}
            </Link>
            <Link
              href={withMarketingLocalePath(pathname, "/onboarding")}
              className={cn(
                "hidden rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-on)] sm:inline-flex",
              )}
            >
              {c.ctaStart}
            </Link>
            <button
              type="button"
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full border transition md:hidden",
                homeHero
                  ? "border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30"
                  : "border-[var(--border)] text-[var(--fg)] hover:bg-[var(--bg-muted)]",
              )}
              aria-label={c.menuAria}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-[var(--bg-charcoal)]/95 pt-24 md:hidden">
          <nav className="container-page flex flex-col gap-6 text-xl font-bold text-white">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href={withMarketingLocalePath(pathname, "/login")} onClick={() => setOpen(false)} data-testid="mobile-nav-login">
              {c.login}
            </Link>
            <Link
              href={withMarketingLocalePath(pathname, "/signup")}
              className="text-[var(--accent)]"
              onClick={() => setOpen(false)}
              data-testid="mobile-nav-signup"
            >
              {c.navSignup}
            </Link>
            <Link
              href={withMarketingLocalePath(pathname, "/onboarding")}
              className="text-white/80"
              onClick={() => setOpen(false)}
            >
              {c.ctaStart} →
            </Link>
            <MarketingLocaleSwitcher dark />
          </nav>
        </div>
      )}
    </>
  );
}
