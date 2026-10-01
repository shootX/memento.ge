import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "ფასები — Momenti",
  description: "ქორწილის ფოტოალბომის პაკეტები საქართველოში",
};

export default function PricingPage() {
  return (
    <main className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-4xl font-semibold">ფასები</h1>
        <p className="mt-4 text-[var(--color-muted)]">
          ერთჯერადი ღონისძიების პაკეტები GEL-ში. პარტნიორებისთვის — ცალკე გამოწერა.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {Object.values(PLANS).map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-[var(--color-border)] bg-white/80 p-8 text-center shadow-sm"
          >
            <p className="font-display text-xl">{p.nameKa}</p>
            <p className="mt-3 text-4xl font-semibold text-[var(--color-forest)]">
              {p.priceGel} ₾
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--color-muted)] text-left">
              <li>{p.maxUploads} ატვირთვა</li>
              <li>{p.retentionDays} დღე ონლაინ</li>
              <li>QR ბარათები + სლაიდშოუ</li>
            </ul>
            <Link href="/onboarding" className="block mt-8">
              <Button className="w-full">არჩევა</Button>
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center mt-12 text-sm text-[var(--color-muted)]">
        Partner Pro: white-label, კრედიტები და კომისია —{" "}
        <Link href="/for-partners" className="underline">პარტნიორების გვერდი</Link>
      </p>
    </main>
  );
}
