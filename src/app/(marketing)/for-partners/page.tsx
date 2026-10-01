import Link from "next/link";
import { Button } from "@/components/ui/button";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "995555123456";

export const metadata = { title: "პარტნიორებისთვის — Momenti" };

export default function ForPartnersPage() {
  return (
    <main className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center animate-fade-up">
        <p className="text-5xl">🤝</p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-tight">
          ფოტოგრაფებს <span className="text-gradient">და დარბაზებს</span>
        </h1>
        <p className="mt-6 text-lg text-[var(--text-muted)]">
          თქვენი ლოგო და ფერები სტუმრის გვერდზე · კრედიტები · 15% კომისია
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
          {[
            { t: "White-label", d: "QR + guest page", e: "🎨" },
            { t: "კრედიტები", d: "bulk ღონისძიებები", e: "💳" },
            { t: "რეფერალი", d: "კომისიის თრეკერი", e: "📈" },
          ].map((x) => (
            <div key={x.t} className="card-chunky p-5">
              <span className="text-2xl">{x.e}</span>
              <p className="mt-2 font-bold">{x.t}</p>
              <p className="text-sm text-[var(--text-muted)]">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/partner">
            <Button className="btn-gradient border-0 px-8">Partner დაფა</Button>
          </Link>
          <a
            href={`https://wa.me/${wa}`}
            className="rounded-full border-2 border-[var(--text-ink)] bg-white px-6 py-3 font-bold shadow-[4px_4px_0_#1a1025]"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
