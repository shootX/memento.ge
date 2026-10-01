"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/pricing", label: "ფასები" },
  { href: "/for-partners", label: "პარტნიორებს" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeaderNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-[3px] z-50 border-b border-[var(--border-soft)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="container-page flex items-center justify-between py-4">
          <Link
            href="/"
            className="font-display text-lg font-extrabold tracking-tight text-[var(--fg)]"
          >
            მემენტო<span className="text-[var(--accent)]">.</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--muted)] md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-[var(--accent)]">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-[var(--muted)] hover:text-[var(--fg)] sm:inline"
            >
              შესვლა
            </Link>
            <Link
              href="/onboarding"
              className="hidden rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-on)] md:inline-flex"
            >
              დაიწყე
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] text-[var(--fg)] md:hidden"
              aria-label="მენიუ"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-20 md:hidden">
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
