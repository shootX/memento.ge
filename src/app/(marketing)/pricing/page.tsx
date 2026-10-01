import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata = {
  title: "ფასები — Memento",
  description: "ქორწილის ფოტოალბომის პაკეტები საქართველოში",
};

export default function PricingPage() {
  return (
    <main className="section-y-lg">
      <div className="container-page mx-auto max-w-2xl text-center motion-safe:animate-fade-up">
        <p className="type-label">პაკეტები</p>
        <h1 className="type-section-title mt-2">
          <span className="text-gradient">ფასები</span>
        </h1>
        <p className="type-body-lg mx-auto mt-4">
          ერთჯერადი პაკეტები · ფოტოგრაფებისთვის ცალკე პარტნიორობა
        </p>
      </div>
      <div className="container-page mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {Object.values(PLANS).map((p) => (
          <div
            key={p.id}
            className={cn(
              "card-chunky flex flex-col p-8 text-left motion-safe:transition-transform motion-safe:hover:-translate-y-1",
              p.id === "classic" && "ring-4 ring-[var(--accent)] md:scale-[1.02]",
            )}
          >
            <p className="type-label">{p.nameKa}</p>
            <p className="mt-3 font-display text-5xl font-extrabold text-gradient">{p.priceGel} ₾</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--muted)]">
              <li>{p.maxUploads} ატვირთვა</li>
              <li>{p.retentionDays} დღე ონლაინ</li>
              <li>სლაიდშოუ + QR ბარათები</li>
            </ul>
            <Link href="/onboarding" className="mt-8 block">
              <Button className="btn-gradient w-full border-0">არჩევა</Button>
            </Link>
          </div>
        ))}
      </div>
      <p className="container-page mt-12 text-center text-sm text-[var(--muted)]">
        Partner Pro — white-label და კრედიტები{" "}
        <Link href="/for-partners" className="font-bold text-[var(--accent)] underline-offset-2 hover:underline">
          პარტნიორობა →
        </Link>
      </p>
    </main>
  );
}
