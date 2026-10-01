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
    <main className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl text-center animate-fade-up">
        <p className="text-4xl">💜</p>
        <h1 className="mt-2 font-display text-5xl font-bold">
          <span className="text-gradient">ფასები</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--text-muted)]">
          ერთჯერადი პაკეტები · ფოტოგრაფებისთვის ცალკე პარტნიორობა
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {Object.values(PLANS).map((p) => (
          <div
            key={p.id}
            className={cn(
              "card-chunky p-8 text-center transition hover:-translate-y-1",
              p.id === "classic" && "ring-4 ring-[var(--pink)]",
            )}
          >
            <p className="text-2xl">{p.id === "starter" ? "🌸" : p.id === "classic" ? "✨" : "👑"}</p>
            <p className="mt-2 font-display text-xl font-bold">{p.nameKa}</p>
            <p className="mt-3 text-5xl font-extrabold text-gradient">{p.priceGel} ₾</p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--text-muted)] text-left">
              <li>📸 {p.maxUploads} ატვირთვა</li>
              <li>📅 {p.retentionDays} დღე ონლაინ</li>
              <li>🎬 სლაიდშოუ + QR ბარათები</li>
            </ul>
            <Link href="/onboarding" className="block mt-8">
              <Button className="btn-gradient w-full border-0">არჩევა</Button>
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center mt-12 text-sm text-[var(--text-muted)]">
        Partner Pro — white-label და კრედიტები{" "}
        <Link href="/for-partners" className="font-bold text-[var(--pink)] underline">
          აქ →
        </Link>
      </p>
    </main>
  );
}
