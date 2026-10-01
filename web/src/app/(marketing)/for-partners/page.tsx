import Link from "next/link";
import { Button } from "@/components/ui/button";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "995555123456";

export const metadata = { title: "პარტნიორებისთვის — Momenti" };

export default function ForPartnersPage() {
  return (
    <main className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-semibold">ფოტოგრაფებს და დარბაზებს</h1>
        <p className="mt-4 text-lg text-[var(--color-muted)]">
          White-label QR და სტუმრის გვერდი თქვენი ლოგოთი, ღონისძიების კრედიტები და 15% referral
          კომისია ყოველ გაყიდვაზე.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/partner">
            <Button>Partner დაფა</Button>
          </Link>
          <a
            href={`https://wa.me/${wa}`}
            className="rounded-full border border-[var(--color-border)] px-6 py-2.5 text-sm"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
