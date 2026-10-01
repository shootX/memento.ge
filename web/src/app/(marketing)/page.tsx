import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingHeroShowcase } from "@/components/marketing/landing-hero-showcase";
import { LandingLiveTicker } from "@/components/marketing/landing-live-ticker";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingSocialProof } from "@/components/marketing/landing-social-proof";
import { LandingQrPlayground } from "@/components/marketing/landing-qr-playground";
import { LandingPricingShowcase } from "@/components/marketing/landing-pricing-showcase";
import { LandingFinalCta } from "@/components/marketing/landing-final-cta";
import { getDemoEventStats } from "@/lib/demo-stats";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "995555123456";

export default async function HomePage() {
  let liveUploadCount = 128;
  try {
    const stats = await getDemoEventStats();
    liveUploadCount = stats.liveUploadCount;
  } catch {
    /* build / offline */
  }

  return (
    <main className="overflow-hidden">
      <section className="section-y-lg relative pt-6 md:pt-10">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="motion-safe:animate-fade-up text-center lg:text-left">
              <p className="eyebrow">🇬🇪 საქართველო · ქორწილის QR ალბომი</p>
              <h1 className="type-hero mt-6">
                <span className="text-gradient">ყველა ფოტო</span>
                <br />
                ერთ საღამოში
              </h1>
              <p className="type-body-lg mx-auto mt-6 lg:mx-0">
                სტუმრები ატვირთავენ ტელეფონით — ლაივ სლაიდშოუ, სტუმრების წიგნი და ბეჭდვადი QR
                ბარათები ერთ ადგილას.
              </p>
              <LandingLiveTicker initialCount={liveUploadCount} />
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Link href="/onboarding">
                  <Button className="btn-gradient border-0 px-10 py-6 text-lg">დავიწყოთ</Button>
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
            <LandingHeroShowcase />
          </div>
        </div>
      </section>

      <LandingHowItWorks />
      <LandingSocialProof />
      <section className="section-y container-page">
        <LandingQrPlayground />
      </section>
      <LandingPricingShowcase />
      <LandingFinalCta />
    </main>
  );
}
