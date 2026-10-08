import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" data-testid="not-found">
      <p className="text-6xl font-bold">404</p>
      <h1 className="font-display text-2xl font-bold">გვერდი ვერ მოიძებნა</h1>
      <p className="max-w-md text-sm text-[var(--muted)]">
        შესაძლება ბმული აღარ არის აქტუალური. დაბრუნდი მთავარ გვერდზე.
      </p>
      <Link href="/" className="pill-cta mt-2 inline-flex">
        <span>მთავარი</span>
      </Link>
    </main>
  );
}
