import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LandingQrPlayground } from "@/components/marketing/landing-qr-playground";

export const metadata = {
  title: "ფასები — Memento",
  description: "ქორწილის ფოტოალბომის პაკეტები საქართველოში",
};

export default function PricingPage() {
  return (
    <main className="section-y-lg">
      <div className="container-page mx-auto max-w-2xl text-center motion-safe:animate-fade-up">
        <p className="type-label">პაკეტები</p>
        <h1 className="type-hero mt-4">
          <span className="text-gradient">ფასები</span>
        </h1>
        <p className="type-body-lg mx-auto mt-4">
          ერთჯერადი პაკეტები · ფოტოგრაფებისთვის ცალკე პარტნიორობა
        </p>
      </div>

      <div className="container-page mt-14 grid max-w-5xl gap-8 md:grid-cols-3 md:items-stretch">
        {Object.values(PLANS).map((p) => {
          const popular = p.id === "classic";
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[var(--radius-xl)] border-[3px] bg-white p-8 shadow-[var(--shadow-playful)]",
                popular
                  ? "border-[var(--accent)] md:-translate-y-3 md:scale-105 ring-4 ring-[var(--accent)]/25"
                  : "border-[var(--border-soft)]",
              )}
            >
              {popular && (
                <div className="absolute inset-x-0 top-0 h-2 bg-[var(--gradient-signature)]" />
              )}
              {popular && (
                <span className="absolute right-4 top-5 rounded-full btn-gradient px-3 py-1 text-xs font-bold text-white">
                  ყველაზე პოპულარული · 99 ₾
                </span>
              )}
              <p className="type-label mt-2">{p.nameKa}</p>
              <p className="mt-4 font-display text-6xl font-bold text-gradient">{p.priceGel} ₾</p>
              <ul className="mt-8 flex-1 space-y-3 border-t-2 border-[var(--border-soft)] pt-6 text-[var(--fg-2)]">
                <li className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">ატვირთვები</span>
                  <span className="font-bold">{p.maxUploads}</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">ონლაინ</span>
                  <span className="font-bold">{p.retentionDays} დღე</span>
                </li>
                <li className="text-sm font-semibold">სლაიდშოუ + QR ბარათები</li>
              </ul>
              <Link href="/onboarding" className="mt-8 block">
                <Button
                  className={cn(
                    "w-full border-0 py-6 text-lg",
                    popular ? "btn-gradient" : "btn-gradient opacity-95",
                  )}
                >
                  არჩევა
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      <section className="section-y container-page mt-8 border-t-2 border-[var(--border-soft)] pt-16">
        <LandingQrPlayground />
      </section>

      <p className="container-page pb-8 text-center text-sm text-[var(--muted)]">
        Partner Pro — white-label და კრედიტები{" "}
        <Link href="/for-partners" className="font-bold text-[var(--accent)] underline-offset-2 hover:underline">
          პარტნიორობა →
        </Link>
      </p>
    </main>
  );
}
