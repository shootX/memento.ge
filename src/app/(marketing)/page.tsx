import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { MessageCircle, QrCode, Sparkles, Users, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "995555123456";

const photos = [
  "/seed-samples/wedding-1.jpg",
  "/seed-samples/wedding-4.jpg",
  "/seed-samples/wedding-6.jpg",
  "/seed-samples/wedding-2.jpg",
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative px-4 pb-16 pt-12 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-sm font-bold shadow-md">
                🇬🇪 საქართველო · QR ალბომი
              </p>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-7xl">
                <span className="text-gradient">ფოტოები</span>
                <br />
                ერთ ალბომში ✨
              </h1>
              <p className="mt-6 text-lg text-[var(--text-muted)] md:text-xl">
                QR მაგიდაზე — სტუმრები ატვირთავენ ტელეფონიდან, აპის გარეშე. ლაივ სლაიდშოუ,
                guestbook და ფერადი ბარათები.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Link href="/onboarding">
                  <Button className="btn-gradient border-0 px-8 py-6 text-lg">
                    დავიწყოთ 🚀
                  </Button>
                </Link>
                <a
                  href={`https://wa.me/${wa}?text=${encodeURIComponent("გამარჯობა, მემენტოს შესახებ")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--text-ink)] bg-white px-6 py-3 font-bold shadow-[4px_4px_0_#1a1025]"
                >
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 animate-fade-up">
              {photos.map((src, i) => (
                <div
                  key={src}
                  className={cn(
                    "overflow-hidden rounded-3xl border-4 border-white shadow-lg",
                    i % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg]",
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <img src={src} alt="" className="aspect-[3/4] w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-3">
        {[
          { icon: QrCode, title: "QR მაგიდაზე", text: "3 ფერადი ბარათი · PDF/PNG", emoji: "🎨" },
          { icon: Users, title: "სუპერ მარტივი", text: "iOS · Android · სუსტი Wi‑Fi", emoji: "📱" },
          { icon: Sparkles, title: "ლაივ სლაიდშოუ", text: "ახალი ფოტო ეკრანზე მაშინვე", emoji: "🎬" },
        ].map(({ icon: Icon, title, text, emoji }) => (
          <div key={title} className="card-chunky p-6 transition hover:-translate-y-1">
            <span className="text-3xl">{emoji}</span>
            <Icon className="mt-3 h-8 w-8 text-[var(--pink)]" />
            <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
            <p className="mt-2 text-[var(--text-muted)]">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center font-display text-4xl font-bold">
          ფასები <span className="text-gradient">💜</span>
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "card-chunky p-6",
                plan.id === "classic" && "ring-4 ring-[var(--pink)]",
              )}
            >
              <p className="font-display text-3xl font-bold">{plan.priceGel} ₾</p>
              <p className="mt-1 text-lg font-bold">{plan.nameKa}</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
                <li>📸 {plan.maxUploads} ატვირთვა</li>
                <li>📅 {plan.retentionDays} დღე ონლაინ</li>
              </ul>
              <Link href="/onboarding" className="mt-6 block">
                <Button className="btn-gradient w-full border-0">არჩევა</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-pink-100 bg-white/60 px-4 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Zap className="h-10 w-10 text-[var(--orange)]" />
          <h2 className="mt-4 text-3xl font-extrabold">ფოტოგრაფებს და დარბაზებს</h2>
          <p className="mt-3 text-[var(--text-muted)]">
            თქვენი ლოგო, ფერები და კომისია ყოველ ღონისძიებაზე.
          </p>
          <Link href="/for-partners" className="mt-6">
            <Button variant="outline" className="font-bold">
              პარტნიორობა →
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
