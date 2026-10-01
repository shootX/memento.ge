"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/pricing", label: "ფასები" },
  { href: "/for-partners", label: "პარტნიორებს" },
  { href: "/faq", label: "კითხვები" },
];

export function SiteHeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const homeHero = pathname === "/";

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
          <nav
            className={cn(
              "hidden items-center gap-8 text-sm font-semibold text-[var(--muted)]",
              !homeHero && "md:flex",
            )}
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-[var(--accent)]">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                "hidden text-sm font-semibold sm:inline",
                homeHero ? "text-white/80 hover:text-white" : "text-[var(--muted)] hover:text-[var(--fg)]",
              )}
            >
              შესვლა
            </Link>
            <Link
              href="/onboarding"
              className={cn(
                "hidden rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-on)]",
                !homeHero && "md:inline-flex",
              )}
            >
              დაიწყე
            </Link>
            <button
              type="button"
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full border text-[var(--fg)] transition hover:bg-white/10",
                homeHero
                  ? "border-white/30 bg-black/20 text-white backdrop-blur-sm"
                  : "border-[var(--border)]",
                !homeHero && "md:hidden",
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
        <div className={cn("fixed inset-0 z-40 bg-black/95 pt-20", !homeHero && "md:hidden")}>
          <nav className="container-page flex flex-col gap-6 text-xl font-bold">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/onboarding" className="text-[var(--accent)]" onClick={() => setOpen(false)}>
              დაიწყე →
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
