import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PLANS } from "@/lib/plans";
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
  "bg-[var(--accent)] text-[var(--accent-on)]",
  "bg-[var(--accent-amber)] text-[var(--accent-on)]",
  "bg-[var(--accent-sky)] text-[#0a1628]",
];

const statAccents = ["var(--accent)", "var(--accent-amber)", "var(--accent-sky)"];

const features = [
  "ლაივ სლაიდშოუ ეკრანზე",
  "ერთჯერადი კამერის რეჟიმი",
  "სტუმრების წიგნი + ხმოვანი შეტყობინება",
  "QR ბარათები PDF/PNG",
  "ZIP ჩამოტვირთვა ჰოსტისგან",
];

const testimonials = [
  {
    names: "ნინო & გიორგი",
    quote: "სტუმრებმა 400+ ფოტო ატვირთეს ერთ საღამოში.",
    img: "/seed-samples/wedding-4.jpg",
  },
  {
    names: "ანა & დავით",
    quote: "სლაიდშოუმ ცეკვის დარბაზი აწვივა.",
    img: "/seed-samples/wedding-6.jpg",
  },
];

const gallery = [
  { src: "/seed-samples/wedding-4.jpg", tags: ["ქორწილი"] },
  { src: "/seed-samples/wedding-5.jpg", tags: ["ქორწილი", "სანაპირო"] },
  { src: "/seed-samples/wedding-3.jpg", tags: ["ნიშნობა"] },
  { src: "/seed-samples/wedding-2.jpg", tags: ["ქორწილი"] },
  { src: "/seed-samples/wedding-6.jpg", tags: ["კორპორატიული"] },
  { src: "/seed-samples/wedding-7.jpg", tags: ["დაბადების დღე"] },
];

const faqs = [
  { q: "სტუმარს აპი სჭირდება?", a: "არა — QR-ით ბრაუზერში ატვირთავს." },
  { q: "როგორ ვიღებთ ფოტოებს?", a: "ZIP ჰოსტის პანელიდან; ვადა პაკეტის მიხედვით." },
  { q: "სუსტ Wi‑Fi?", a: "ხელახალი ცდა + კომპრესია დიდ ფაილებზე." },
];

export function LandingV9() {
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
                მემენტო<span className="text-[var(--accent)]">.</span>
              </h1>
              <div className="flex max-w-xl flex-col gap-8 lg:pb-2">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-[var(--accent)] md:text-3xl" aria-hidden>
                    ✱
                  </span>
                  <p className="text-lg leading-snug text-[var(--fg-2-on-dark)] md:text-xl">
                    <span className="font-semibold text-[var(--accent)]">ქორწილის ყველა ფოტო</span> — ერთ ალბომში,{" "}
                    <span className="font-semibold text-[var(--accent)]">QR-ით</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/onboarding" className="pill-cta">
                    <span>დაიწყე</span>
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

      <section className="section-y section-light">
        <div className="container-page">
          <SectionHead num="01" label="როგორ მუშაობს" title="QR → ატვირთვა → ლაივ ალბომი" />
          <ol className="grid gap-8 md:grid-cols-3">
            {[
              { t: "QR მაგიდაზე", d: "ბეჭდვადი ბარათი — სტუმარი სკანერით შედის." },
              { t: "სტუმრები ატვირთავენ", d: "ფოტო/ვიდეო ბრაუზერიდან, აპის გარეშე." },
              { t: "ლაივ სლაიდშოუ", d: "ახალი კადრები ეკრანზე და ZIP ერთ კლიკში." },
            ].map((step, i) => (
              <li key={step.t} className="border-t border-[var(--border)] pt-6">
                <p className="text-sm font-bold text-[var(--accent)]">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step.t}</h3>
                <p className="mt-2 text-[var(--muted)]">{step.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 grid gap-8 border-t border-[var(--border-soft)] pt-10 sm:grid-cols-3">
            {[
              { n: "3", l: "ენა", sub: "ka · en · ru" },
              { n: "0", l: "აპლიკაცია", sub: "ჩამოსატვირთი" },
              { n: "1", l: "QR", sub: "ყველა სტუმრისთვის" },
            ].map((s, i) => (
              <div key={s.l}>
                <p
                  className="font-display text-5xl font-extrabold md:text-6xl"
                  style={{ color: statAccents[i % statAccents.length] }}
                >
                  {s.n}
                </p>
                <p className="mt-1 font-bold">{s.l}</p>
                <p className="text-sm text-[var(--muted)]">{s.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--muted)]">
            დემო სტატისტიკა · არა რეალური მომხმარებლის მონაცემები
          </p>
        </div>
      </section>

      <section className="section-y section-lime">
        <div className="container-page">
          <SectionHead num="02" label="გალერეა" title="არჩეული ღონისძიებები" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g, gi) => (
              <figure key={g.src} className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-playful)]">
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
          <SectionHead num="03" label="ფუნქციები" title="რას გთავაზობთ" />
          <ul className="divide-y divide-[var(--border-soft)] border-y border-[var(--border-soft)]">
            {features.map((f, i) => (
              <li key={f} className="flex items-center justify-between py-6 text-lg font-semibold md:text-xl">
                {f}
                <span style={{ color: statAccents[i % statAccents.length] }}>→</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y section-dark">
        <div className="container-page">
          <SectionHead num="04" label="რატომ მემენტო" title="რატომ ჩვენ" dark />
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { n: "98%", l: "სტუმრები ატვირთავენ QR-ით", d: "დემო UX მეტრიკა" },
              { n: "24/7", l: "ონლაინ ალბომი", d: "ღონისძიების შემდეგაც" },
              { n: "100%", l: "ქართული ინტერფეისი", d: "ka პირველ რიგში" },
            ].map((s, i) => (
              <div key={s.l} className="card-chunky p-8">
                <p
                  className="font-display text-4xl font-extrabold"
                  style={{ color: statAccents[i % statAccents.length] }}
                >
                  {s.n}
                </p>
                <p className="mt-3 font-bold text-white">{s.l}</p>
                <p className="mt-1 text-sm text-[var(--muted-on-dark)]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y section-lime">
        <div className="container-page">
          <SectionHead num="05" label="გამოხმაურებები" title="მაგალითი წყვილები" />
          <p className="-mt-6 mb-8 text-sm text-[var(--muted)]">საჩვენებელი ისტორიები · არა რეალური რევიუ</p>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <blockquote
                key={t.names}
                className={cn(
                  "card-chunky overflow-hidden p-0 ring-2 ring-offset-2 ring-offset-[var(--bg-lime-wash)]",
                  i === 0 ? "ring-[var(--accent-amber)]" : "ring-[var(--accent-sky)]",
                )}
              >
                <div className="relative h-48">
                  <Image src={t.img} alt="" fill className="object-cover" sizes="600px" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-amber)]/25 to-[var(--accent-sky)]/22" />
                </div>
                <div className="p-6">
                  <p className="text-[var(--fg-2)]">&ldquo;{t.quote}&rdquo;</p>
                  <footer
                    className="mt-3 font-bold"
                    style={{ color: statAccents[(i + 1) % statAccents.length] }}
                  >
                    {t.names}
                  </footer>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y section-light" id="pricing" data-testid="landing-pricing">
        <div className="container-page">
          <SectionHead num="06" label="ფასები" title="ფასები" />
          <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
            {(["starter", "classic", "premium"] as const).map((tier) => {
              const p = PLANS[tier];
              const featured = tier === "classic";
              return (
                <div
                  key={tier}
                  className={`flex flex-col rounded-[var(--radius-lg)] border p-8 ${
                    featured
                      ? "border-[var(--accent)] bg-[var(--surface)] ring-2 ring-[var(--accent)]/30"
                      : "border-[var(--border-soft)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  {featured && (
                    <span className="mb-4 inline-flex w-fit rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--accent-on)]">
                      ყველაზე პოპულარული
                    </span>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{p.nameKa}</p>
                  <p className="mt-3 font-display text-5xl font-extrabold">{p.priceGel} ₾</p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm text-[var(--muted)]">
                    <li>{p.maxUploads} ატვირთვა</li>
                    <li>{p.retentionDays} დღე ონლაინ</li>
                  </ul>
                  <Link
                    href={`/onboarding?plan=${p.id}`}
                    className={`mt-8 block text-center rounded-full py-3 text-sm font-bold ${
                      featured
                        ? "bg-[var(--accent)] text-[var(--accent-on)]"
                        : "border border-[var(--border)] text-[var(--fg)]"
                    }`}
                  >
                    არჩევა
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-y section-lime border-t border-[var(--border-soft)]">
        <div className="container-page">
          <LandingQrPlayground />
        </div>
      </section>

      <section className="section-y section-light">
        <div className="container-page">
          <SectionHead num="07" label="პარტნიორები" title="ფოტოგრაფებისთვის" />
          <p className="max-w-2xl text-[var(--muted)]">
            თქვენი ბრენდით QR ალბომი კლიენტებისთვის — კომისია და პარტნიორის პანელი.
          </p>
          <Link href="/for-partners" className="pill-cta mt-8 inline-flex">
            <span>პარტნიორის პროგრამა</span>
            <span className="pill-cta-icon">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      </section>

      <section className="section-y section-light">
        <div className="container-page max-w-3xl">
          <SectionHead num="08" label="კითხვები" title="ხშირი კითხვები" />
          <div className="space-y-3">
            {faqs.map((f) => (
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-on-dark)]">09 · კონტაქტი</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-white">დაგვიკავშირდით</h2>
            <p className="mt-2 text-[var(--muted-on-dark)]">
              <a href="mailto:hello@memento.ge" className="underline hover:text-white">
                hello@memento.ge
              </a>
              {wa ? (
                <>
                  {" · "}
                  <a
                    href={`https://wa.me/${wa}?text=${encodeURIComponent("გამარჯობა, მემენტოს შესახებ")}`}
                    className="underline hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <Link href="/onboarding" className="pill-cta">
            <span>უფასო დაწყება</span>
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
