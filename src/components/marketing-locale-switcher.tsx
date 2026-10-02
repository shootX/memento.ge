"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const locales = [
  { code: "ka", href: "/", label: "ქარ" },
  { code: "en", href: "/en", label: "EN" },
  { code: "ru", href: "/ru", label: "RU" },
] as const;

export function MarketingLocaleSwitcher({
  className,
  dark,
}: {
  className?: string;
  dark?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const active =
    pathname === "/en" || pathname.startsWith("/en/")
      ? "en"
      : pathname === "/ru" || pathname.startsWith("/ru/")
        ? "ru"
        : "ka";

  return (
    <div
      className={cn(
        "flex gap-1 rounded-full p-1",
        dark ? "bg-black/30 border border-white/20" : "bg-[var(--surface-warm)] border border-[var(--border-soft)]",
        className,
      )}
    >
      {locales.map((l) => (
        <Link
          key={l.code}
          href={l.href}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold transition",
            active === l.code
              ? "bg-[var(--accent)] text-[var(--accent-on)]"
              : dark
                ? "text-white/80 hover:text-white"
                : "text-[var(--muted)] hover:text-[var(--fg)]",
          )}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
