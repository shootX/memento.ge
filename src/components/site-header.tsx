import Link from "next/link";

const links = [
  { href: "/pricing", label: "ფასები" },
  { href: "/for-partners", label: "პარტნიორებს" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-pink-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl font-bold text-gradient">
          Momenti ✨
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-muted)]">
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
            className="hidden sm:inline text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--pink)]"
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
