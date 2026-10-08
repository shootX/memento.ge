import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function LandingPricingShowcase() {
  return (
    <section className="section-y container-page">
      <div className="mx-auto max-w-2xl text-center">
        <p className="type-label">პაკეტები</p>
        <h2 className="type-section-title mt-2">შეარჩიე შენი ზომა</h2>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
        {Object.values(PLANS).map((plan) => {
          const popular = plan.id === "classic";
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border-2 bg-white p-6 shadow-[var(--shadow-playful)] transition md:p-8",
                popular
                  ? "border-[var(--accent)] md:-translate-y-2 md:scale-[1.04] ring-4 ring-[var(--accent)]/30"
                  : "border-[var(--border-soft)]",
              )}
            >
              {popular && (
                <span className="absolute right-4 top-4 rounded-full btn-gradient px-3 py-1 text-xs font-bold text-white">
                  ყველაზე პოპულარული
                </span>
              )}
              <p className="type-label">{plan.nameKa}</p>
              <p className="mt-3 font-display text-5xl font-bold text-gradient">{plan.priceGel} ₾</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--muted)]">
                <li>{plan.maxUploads} ატვირთვა</li>
                <li>{plan.retentionDays} დღე ონლაინ</li>
                <li>სლაიდშოუ + QR ბარათები</li>
              </ul>
              <Link href="/onboarding" className="mt-8 block">
                <Button className={cn("w-full border-0", popular ? "btn-gradient py-6 text-lg" : "btn-gradient")}>
                  {popular ? "99 ₾ — დავიწყოთ" : "არჩევა"}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
