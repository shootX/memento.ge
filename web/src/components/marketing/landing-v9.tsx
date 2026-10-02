import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PLANS, type PlanTier } from "@/lib/plans";
import { planMarketingFeatures } from "@/lib/plan-features";
import { getLandingCopy, type LandingLocale } from "@/lib/landing-copy";
import { LandingQrPlayground } from "@/components/marketing/landing-qr-playground";
import { cn } from "@/lib/cn";

const wa =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "995555123456";

function SectionHead({
  num,
  label,
  title,
  dark,
}: {
  num: string;
  label: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.2em]",
            dark ? "text-[var(--muted-on-dark)]" : "text-[var(--muted)]",
          )}
        >
          {num} · {label}
        </p>
        <h2
          className={cn(
            "mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl",
            dark ? "text-white" : "text-[var(--fg)]",
          )}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

const chipStyles = [
  "bg-[var(--lime-badge)] text-[var(--lime-badge-on)]",
  "bg-[var(--accent-amber)] text-[#1a1200]",
  "bg-[var(--accent-sky)] text-[#0a1628]",
];

const statAccents = ["var(--accent)", "var(--accent-amber)", "var(--accent-sky)"];

const gallery = [
  { src: "/seed-samples/wedding-4.jpg", tags: ["ქორწილი"] },
  { src: "/seed-samples/wedding-5.jpg", tags: ["ქორწილი", "სანაპირო"] },
  { src: "/seed-samples/wedding-3.jpg", tags: ["ნიშნობა"] },
  { src: "/seed-samples/wedding-2.jpg", tags: ["ქორწილი"] },
  { src: "/seed-samples/wedding-6.jpg", tags: ["კორპორატიული"] },
  { src: "/seed-samples/wedding-7.jpg", tags: ["დაბადების დღე"] },
];

const featuresKa = [
  "ლაივ სლაიდშოუ ეკრანზე",
  "ერთჯერადი კამერის რეჟიმი",
  "სტუმრების წიგნი + ხმოვანი შეტყობინება",
  "QR ბარათები PDF/PNG",
  "ZIP ჩამოტვირთვა ჰოსტისგან",
];

const faqsKa = [
  { q: "სტუმარს აპი სჭირდება?", a: "არა — QR-ით ბრაუზერში ატვირთავს." },
  { q: "როგორ ვიღებთ ფოტოებს?", a: "ZIP ჰოსტის პანელიდან; ვადა პაკეტის მიხედვით." },
  { q: "სუსტ Wi‑Fi?", a: "ხელახალი ცდა; სწრაფ კავშირზე ორიგინალი ხარისხი." },
];

export function LandingV9({ locale = "ka" }: { locale?: LandingLocale }) {
  const c = getLandingCopy(locale);
  const planName = (tier: PlanTier) =>
    locale === "en" ? PLANS[tier].nameEn : locale === "ru" ? PLANS[tier].nameEn : PLANS[tier].nameKa;

  return (
    <main className="overflow-x-hidden">
      <section className="relative min-h-[90vh] md:min-h-screen" data-testid="landing-hero">
        <Image
          src="/seed-samples/wedding-6.jpg"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          data-testid="hero-phone-photo"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/28 to-black/5" />
        <div className="relative flex min-h-[90vh] flex-col justify-end pb-10 md:min-h-screen md:pb-14">
          <div className="container-page">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h1 className="hero-wordmark shrink-0" data-testid="hero-wordmark">
                {locale === "en" ? "Memento" : locale === "ru" ? "Memento" : "მემენტო"}
                <span className="text-[var(--accent)]">.</span>
              </h1>
              <div className="flex max-w-xl flex-col gap-8 lg:pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-[var(--accent)] md:text-3xl" aria-hidden>
                    ✱
                  </span>
                  <p className="text-lg leading-snug text-[var(--fg-2-on-dark)] md:text-xl">
                    <span className="font-semibold text-[var(--accent)]">{c.heroLine}</span> — {c.heroSub},{" "}
                    <span className="font-semibold text-[var(--accent)]">{c.heroLineAccent}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/onboarding" className="pill-cta">
                    <span>{c.ctaStart}</span>
                    <span className="pill-cta-icon" aria-hidden>
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </Link>
                  <a
                    href={`https://wa.me/${wa}?text=${encodeURIComponent("გამარჯობა, მემენტოს შესახებ")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline-chunky border-white/25 bg-black/20 text-white backdrop-blur-sm hover:bg-white/10"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y section-light-on-lime" id="pricing" data-testid="landing-pricing">
        <div className="container-page">
          <SectionHead num="01" label={c.pricingLabel} title={c.pricingTitle} />
          <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
            {(["starter", "classic", "premium"] as const).map((tier) => {
              const p = PLANS[tier];
              const featured = tier === "classic";
              const feats = planMarketingFeatures(tier, locale);
              return (
                <div
                  key={tier}
                  className={`flex flex-col rounded-[var(--radius-lg)] border p-8 ${
                    featured
                      ? "border-[var(--lime-badge)] bg-[var(--surface)] ring-2 ring-[var(--lime-badge)]/40"
                      : "border-[var(--border-soft)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  {featured && (
                    <span className="mb-4 inline-flex w-fit rounded-full bg-[var(--lime-badge)] px-3 py-1 text-xs font-bold text-[var(--lime-badge-on)]">
                      {c.popular}
                    </span>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                    {planName(tier)}
                  </p>
                  <p className="mt-3 font-display text-5xl font-extrabold">{p.priceGel} ₾</p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm text-[var(--fg-2)]">
                    {feats.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-[var(--lime-badge)]">✓</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/onboarding?plan=${p.id}`}
                    className={`mt-8 block text-center rounded-full py-3 text-sm font-bold ${
                      featured
                        ? "bg-[var(--lime-badge)] text-[var(--lime-badge-on)]"
                        : "border border-[var(--border)] text-[var(--fg)]"
                    }`}
                  >
                    {c.choosePlan}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-y section-light">
        <div className="container-page">
          <SectionHead num="02" label={c.howLabel} title={c.howTitle} />
          <ol className="grid gap-8 md:grid-cols-3">
            {[
              { t: "QR მაგიდაზე", d: "ბეჭდვადი ბარათი — სტუმარი სკანერით შედის." },
              { t: "სტუმრები ატვირთავენ", d: "ფოტო/ვიდეო ბრაუზერიდან, აპის გარეშე." },
              { t: "ლაივ სლაიდშოუ", d: "ახალი კადრები ეკრანზე და ZIP ერთ კლიკში." },
            ].map((step, i) => (
              <li key={step.t} className="border-t border-[var(--border)] pt-6">
                <p className="text-sm font-bold text-[var(--lime-badge)]">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step.t}</h3>
                <p className="mt-2 text-[var(--muted)]">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-y section-light-on-lime">
        <div className="container-page">
          <SectionHead num="03" label="გალერეა" title="არჩეული ღონისძიებები" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g, gi) => (
              <figure
                key={g.src}
                className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-playful)]"
              >
                <Image src={g.src} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="400px" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161616]/90 via-[var(--accent-sky)]/18 to-[var(--accent)]/12" />
                <figcaption className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {g.tags.map((tag, ti) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold shadow-sm",
                        chipStyles[(gi + ti) % chipStyles.length],
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y section-light">
        <div className="container-page">
          <SectionHead num="04" label={c.featuresLabel} title={c.featuresTitle} />
          <ul className="divide-y divide-[var(--border-soft)] border-y border-[var(--border-soft)]">
            {featuresKa.map((f, i) => (
              <li key={f} className="flex items-center justify-between py-6 text-lg font-semibold md:text-xl">
                {f}
                <span style={{ color: statAccents[i % statAccents.length] }}>→</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y section-light-on-lime border-t border-[var(--border-soft)]">
        <div className="container-page">
          <LandingQrPlayground />
        </div>
      </section>

      <section className="section-y section-light">
        <div className="container-page">
          <SectionHead num="05" label="პარტნიორები" title={c.partnersTitle} />
          <p className="max-w-2xl text-[var(--muted)]">{c.partnersBody}</p>
          <Link href="/for-partners" className="pill-cta mt-8 inline-flex">
            <span>{locale === "en" ? "Partner program" : locale === "ru" ? "Партнёрская программа" : "პარტნიორის პროგრამა"}</span>
            <span className="pill-cta-icon">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      </section>

      <section className="section-y section-light">
        <div className="container-page max-w-3xl">
          <SectionHead num="06" label={c.faqLabel} title={c.faqTitle} />
          <div className="space-y-3">
            {faqsKa.map((f) => (
              <details key={f.q} className="group rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-[var(--surface)] px-6 py-4">
                <summary className="cursor-pointer list-none font-bold marker:content-none [&::-webkit-details-marker]:hidden">
                  {f.q}
                </summary>
                <p className="mt-3 text-[var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="section-y section-dark border-t border-[var(--border-on-dark)]">
        <div className="container-page flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-on-dark)]">07 · კონტაქტი</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-white">{c.contactTitle}</h2>
            <p className="mt-2 text-[var(--muted-on-dark)]">
              <a href="mailto:hello@memento.ge" className="underline hover:text-white">
                hello@memento.ge
              </a>
            </p>
          </div>
          <Link href="/onboarding" className="pill-cta">
            <span>{c.freeStart}</span>
            <span className="pill-cta-icon">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
        <p className="container-page mt-12 text-xs text-[var(--muted-on-dark)]">© {new Date().getFullYear()} Memento · memento.ge</p>
      </footer>
    </main>
  );
}
