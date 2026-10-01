import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/cn";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "995555123456";

const photos = [
  { src: "/seed-samples/wedding-1.jpg", priority: true },
  { src: "/seed-samples/wedding-4.jpg", priority: false },
  { src: "/seed-samples/wedding-6.jpg", priority: false },
  { src: "/seed-samples/wedding-2.jpg", priority: false },
];

const features = [
  { title: "QR მაგიდაზე", text: "სამი სტილი · PDF და PNG ბეჭდვა", emoji: "🎨" },
  { title: "სტუმრისთვის მარტივი", text: "აპის გარეშე · iOS და Android", emoji: "📱" },
  { title: "ლაივ სლაიდშოუ", text: "ახალი ფოტო ეკრანზე მაშინვე", emoji: "🎬" },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="section-y-lg relative pt-8 md:pt-12">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="motion-safe:animate-fade-up text-center lg:text-left">
              <p className="eyebrow">🇬🇪 საქართველო · QR ალბომი</p>
              <h1 className="type-hero mt-6">
                <span className="text-gradient">ფოტოები</span>
                <br />
                ერთ ალბომში
              </h1>
              <p className="type-body-lg mx-auto mt-6 lg:mx-0">
                QR მაგიდაზე — სტუმრები ატვირთავენ ტელეფონიდან. ლაივ სლაიდშოუ, guestbook და
                ფერადი ბარათები ერთ ადგილას.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Link href="/onboarding">
                  <Button className="btn-gradient border-0 px-8 py-6 text-lg">დავიწყოთ</Button>
                </Link>
                <a
                  href={`https://wa.me/${wa}?text=${encodeURIComponent("გამარჯობა, მემენტოს შესახებ")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline-chunky"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 motion-safe:animate-fade-up">
              {photos.map(({ src, priority }, i) => (
                <div
                  key={src}
                  className={cn(
                    "overflow-hidden rounded-[var(--radius-lg)] border-4 border-white shadow-lg",
                    i % 2 === 0 ? "motion-safe:rotate-[-1deg]" : "motion-safe:rotate-[1deg]",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    width={480}
                    height={640}
                    sizes="(max-width: 1024px) 50vw, 240px"
                    priority={priority}
                    fetchPriority={priority ? "high" : "auto"}
                    loading={priority ? undefined : "lazy"}
                    quality={72}
                    className="aspect-[3/4] h-auto w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-defer section-y container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="type-label">რატომ მემენტო</p>
          <h2 className="type-section-title mt-2">ყველაფერი ქორწილის დღისთვის</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map(({ title, text, emoji }) => (
            <div
              key={title}
              className="card-chunky p-6 motion-safe:transition-transform motion-safe:hover:-translate-y-1"
            >
              <div className="feature-icon" aria-hidden>
                {emoji}
              </div>
              <h3 className="mt-4 text-xl font-extrabold leading-snug">{title}</h3>
              <p className="mt-2 text-[var(--muted)] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-defer section-y container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="type-label">პაკეტები</p>
          <h2 className="type-section-title mt-2">
            ფასები <span className="text-gradient">გამჭვირვალე</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "card-chunky flex flex-col p-6",
                plan.id === "classic" && "ring-4 ring-[var(--accent)] md:scale-[1.02]",
              )}
            >
              <p className="type-label">{plan.nameKa}</p>
              <p className="mt-2 font-display text-4xl font-bold text-gradient">{plan.priceGel} ₾</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--muted)]">
                <li>{plan.maxUploads} ატვირთვა</li>
                <li>{plan.retentionDays} დღე ონლაინ</li>
                <li>სლაიდშოუ და QR ბარათები</li>
              </ul>
              <Link href="/onboarding" className="mt-6 block">
                <Button className="btn-gradient w-full border-0">არჩევა</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section-defer border-t-2 border-[var(--border-soft)] bg-white/70 section-y">
        <div className="container-narrow flex flex-col items-center text-center">
          <p className="type-label">პარტნიორებს</p>
          <h2 className="type-section-title mt-2">ფოტოგრაფები და დარბაზები</h2>
          <p className="type-body-lg mt-3">
            თქვენი ლოგო, ფერები და კომისია ყოველ ღონისძიებაზე.
          </p>
          <Link href="/for-partners" className="mt-6">
            <Button variant="outline" className="font-bold">
              პარტნიორობა
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
