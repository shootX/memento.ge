import Link from "next/link";

const links = [
  { href: "/pricing", label: "ფასები" },
  { href: "/for-partners", label: "პარტნიორებს" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-[var(--color-cream)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Momenti
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--color-muted)]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--color-ink)] transition">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            შესვლა
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-[var(--color-forest)] px-4 py-2 text-sm font-medium text-white"
          >
            დაწყება
          </Link>
        </div>
      </div>
    </header>
  );
}
