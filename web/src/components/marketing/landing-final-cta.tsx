import Link from "next/link";
import { Button } from "@/components/ui/button";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

export function LandingFinalCta() {
  return (
    <section className="section-y-lg">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] btn-gradient px-6 py-14 text-center text-white shadow-[12px_12px_0_#1a1025] md:px-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-30 hero-confetti" aria-hidden />
          <h2 className="relative font-display text-3xl font-bold md:text-5xl">
            მზად ხარ შენი ქორწილის ალბომისთვის?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/90">
            დაიწყე დღეს — QR, ატვირთვები და სლაიდშოუ ერთ ლინკში.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/onboarding">
              <Button className="border-0 bg-white px-10 py-6 text-lg font-bold text-[var(--accent)] hover:bg-[var(--surface-warm)]">
                უფასო დაწყება
              </Button>
            </Link>
            {wa ? (
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent("გამარჯობა, მემენტოს შესახებ")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border-2 border-white/80 px-8 py-4 font-bold text-white hover:bg-white/10"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
