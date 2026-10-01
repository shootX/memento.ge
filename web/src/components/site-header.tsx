import Link from "next/link";

const links = [
  { href: "/pricing", label: "ფასები" },
  { href: "/for-partners", label: "პარტნიორებს" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--border-soft)] bg-white/92 backdrop-blur-md">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="font-display text-xl font-bold text-gradient">
          მემენტო
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--muted)]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-[var(--pink)] transition"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"
          >
            შესვლა
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full btn-gradient px-4 py-2 text-sm font-bold text-white"
          >
            დაწყება 🚀
          </Link>
        </div>
      </div>
    </header>
  );
}
