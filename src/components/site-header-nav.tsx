"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { MarketingLocaleSwitcher } from "@/components/marketing-locale-switcher";

const links = [
  { href: "/pricing", label: "ფასები" },
  { href: "/for-partners", label: "პარტნიორებს" },
  { href: "/faq", label: "კითხვები" },
];

export function SiteHeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const homeHero = pathname === "/";

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
            href="/"
            className={cn(
              "font-display text-lg font-extrabold tracking-tight md:text-xl",
              homeHero ? "text-white" : "text-[var(--fg)]",
            )}
          >
            მემენტო<span className="text-[var(--accent)]">.</span>
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
              href="/login"
              className={cn(
                "text-sm font-semibold transition",
                homeHero ? "text-white/85 hover:text-white" : "text-[var(--fg)] hover:text-[var(--accent)]",
              )}
            >
              შესვლა
            </Link>
            <Link
              href="/onboarding"
              className={cn(
                "hidden rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-on)] sm:inline-flex",
              )}
            >
              დაიწყე
            </Link>
            <button
              type="button"
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full border transition md:hidden",
                homeHero
                  ? "border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30"
                  : "border-[var(--border)] text-[var(--fg)] hover:bg-[var(--bg-muted)]",
              )}
              aria-label="მენიუ"
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
            <Link href="/login" onClick={() => setOpen(false)}>
              შესვლა
            </Link>
            <Link href="/onboarding" className="text-[var(--accent)]" onClick={() => setOpen(false)}>
              დაიწყე →
            </Link>
            <MarketingLocaleSwitcher dark />
          </nav>
        </div>
      )}
    </>
  );
}
