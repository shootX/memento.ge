"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";
import { useEffect, useState } from "react";

const links = [
  { href: "/pricing", labelKey: "navPricing" as const },
  { href: "/for-partners", labelKey: "navPartners" as const },
  { href: "/faq", labelKey: "navFaq" as const },
];

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [locale, setLocale] = useState<AuthLocale>("ka");

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--border-soft)] bg-white/92 backdrop-blur-md">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="font-display text-xl font-bold text-gradient">
          {authT(locale, "wordmark")}
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--muted)] md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-[var(--accent)]">
              {authT(locale, l.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-[var(--fg)] hover:text-[var(--accent)]"
                data-testid="header-dashboard"
              >
                {authT(locale, "myDashboard")}
              </Link>
              <LogoutButton className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--fg)]" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-[var(--fg)] hover:text-[var(--accent)]"
                data-testid="header-login"
              >
                {authT(locale, "loginLink")}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-on)]"
                data-testid="header-signup"
              >
                {authT(locale, "signupLink")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
