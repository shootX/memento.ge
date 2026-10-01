import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { MessageCircle, QrCode, Sparkles, Users } from "lucide-react";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "995555123456";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-4xl text-center animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Momenti · საქართველო
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-[var(--color-ink)] md:text-6xl">
            ქორწილის ფოტოები
            <span className="block text-[var(--color-gold)]">ერთ ალბომში</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-muted)]">
            QR კოდი მაგიდაზე — სტუმრები ატვირთავენ ფოტოებს ტელეფონიდან, აპის გარეშე.
            ფოტოგრაფებისა და საქორწინო დარბაზებისთვის.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/create">
              <Button className="text-base px-8 py-3">ღონისძიების შექმნა</Button>
            </Link>
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent("გამარჯობა, Momenti-ს შესახებ მაინტერესებს")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-6 py-3 text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp პარტნიორებს
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 md:grid-cols-3">
        {[
          {
            icon: QrCode,
            title: "QR მაგიდაზე",
            text: "ბეჭდვადი ბარათები ქართულ და ინგლისურ ტექსტით",
          },
          {
            icon: Users,
            title: "სტუმრებისთვის მარტივი",
            text: "სკანირება, არჩევა, ატვირთვა — iOS და Android",
          },
          {
            icon: Sparkles,
            title: "ლაივ სლაიდშოუ",
            text: "ახალი ფოტოები ეკრანზე პირდაპირ ღონისძიებისას",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-2xl border border-[var(--color-border)] bg-white/60 p-6"
          >
            <Icon className="h-8 w-8 text-[var(--color-gold)]" />
            <h2 className="mt-4 font-display text-xl">{title}</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{text}</p>
          </div>
        ))}
      </section>

      <section className="bg-[var(--color-blush)]/50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-3xl">ფასები</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(PLANS).map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-6 text-center"
              >
                <p className="font-display text-lg">{p.nameKa}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-forest)]">
                  {p.priceGel} ₾
                </p>
                <p className="mt-4 text-sm text-[var(--color-muted)]">
                  {p.maxUploads} ფოტო · {p.retentionDays} დღე ონლაინ
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} Momenti · contact: +{wa}
      </footer>
    </main>
  );
}
