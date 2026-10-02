"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";

export function LandingHeroShowcase() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[320px] lg:max-w-none lg:justify-self-end" data-testid="hero-phone-mockup">
      <div className="relative mx-auto aspect-[9/16] w-[min(100%,300px)] rounded-[2.5rem] border-[6px] border-[var(--fg)] bg-[var(--surface-dark)] p-2 shadow-[12px_12px_0_rgba(255,45,138,0.35)]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-[var(--bg)]">
          <div
            className="relative z-10 min-h-0 flex-1 overflow-hidden p-3 pb-0"
            data-testid="hero-phone-static"
          >
            <div className="relative h-full overflow-hidden rounded-2xl border-2 border-white shadow-md">
              <Image
                src="/seed-samples/wedding-4.jpg"
                alt=""
                fill
                className="object-cover opacity-100"
                sizes="280px"
                priority
                data-testid="hero-phone-photo"
              />
            </div>
          </div>

          <div className="relative z-10 shrink-0 p-3 pt-2">
            <div
              className="rounded-2xl bg-white p-3 shadow-lg ring-2 ring-[var(--accent)]/30"
              data-testid="hero-phone-upload-ui"
            >
              <p className="text-center text-[11px] font-bold text-[var(--muted)]">ატვირთვა ალბომში</p>
              <div className="mt-2 flex justify-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full btn-gradient text-lg text-white">
                  +
                </span>
              </div>
            </div>
          </div>

          {!reduce && (
            <div
              className="hero-phone-cycle pointer-events-none absolute inset-x-0 bottom-0 top-[58%] z-20"
              aria-hidden
            >
              <div className="hero-phone-scene hero-phone-scene-1 flex flex-col items-center justify-center gap-3 bg-[var(--bg)]/95 p-4">
                <div className="rounded-2xl bg-white p-3 shadow-lg ring-2 ring-[var(--accent)]">
                  <div className="h-20 w-20 rounded-lg bg-[var(--gradient-signature)]" />
                  <p className="mt-2 text-center text-[10px] font-bold">QR მაგიდაზე</p>
                </div>
              </div>
              <div className="hero-phone-scene hero-phone-scene-3 flex flex-col items-center justify-center gap-2 bg-[var(--bg)]/90 p-4">
                <div className="hero-confetti pointer-events-none absolute inset-0" />
                <p className="relative z-10 text-lg font-display font-bold text-gradient">გმადლობთ!</p>
              </div>
              <div className="hero-phone-scene hero-phone-scene-4 flex flex-col bg-[var(--bg)] p-2">
                <div className="rounded-xl bg-[var(--surface-dark)] p-1">
                  <p className="mb-1 text-center text-[9px] font-bold text-[var(--accent)]">ლაივ სლაიდშოუ</p>
                  <Image
                    src="/seed-samples/wedding-6.jpg"
                    alt=""
                    width={260}
                    height={180}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -right-2 top-1/4 hidden rotate-6 rounded-2xl border-2 border-white bg-white p-2 shadow-lg md:block">
        <Image
          src="/seed-samples/wedding-6.jpg"
          alt=""
          width={80}
          height={100}
          className="h-[100px] w-[80px] rounded-lg object-cover"
          data-testid="hero-float-photo"
        />
      </div>
      <div className="absolute -left-3 bottom-1/4 hidden -rotate-3 rounded-2xl border-2 border-white bg-white p-2 shadow-lg md:block">
        <Image
          src="/seed-samples/wedding-2.jpg"
          alt=""
          width={72}
          height={96}
          className="h-[96px] w-[72px] rounded-lg object-cover"
          data-testid="hero-float-photo"
        />
      </div>
    </div>
  );
}
