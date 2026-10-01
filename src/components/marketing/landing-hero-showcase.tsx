"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

export function LandingHeroShowcase() {
  const reduce = useReducedMotion();

  return (
    <div
      className="relative mx-auto w-full max-w-[320px] lg:max-w-none lg:justify-self-end"
      aria-hidden={reduce ?? undefined}
    >
      <div className="relative mx-auto aspect-[9/16] w-[min(100%,300px)] rounded-[2.5rem] border-[6px] border-[var(--fg)] bg-[var(--surface-dark)] p-2 shadow-[12px_12px_0_rgba(255,45,138,0.35)]">
        <div className="relative h-full overflow-hidden rounded-[2rem] bg-[var(--bg)]">
          <div
            className={cn(
              "hero-phone-cycle absolute inset-0",
              reduce && "hero-phone-cycle--static",
            )}
          >
            <div className="hero-phone-scene hero-phone-scene-1 flex flex-col items-center justify-center gap-3 p-4">
              <div className="rounded-2xl bg-white p-3 shadow-lg ring-2 ring-[var(--accent)]">
                <div className="h-24 w-24 rounded-lg bg-[var(--gradient-signature)] opacity-90" />
                <p className="mt-2 text-center text-[10px] font-bold">QR მაგიდაზე</p>
              </div>
              <p className="text-xs font-bold text-[var(--muted)]">QR სканირება…</p>
            </div>
            <div className="hero-phone-scene hero-phone-scene-2 relative p-3">
              <Image
                src="/seed-samples/wedding-4.jpg"
                alt=""
                width={240}
                height={320}
                className="hero-flying-photo h-auto w-full rounded-xl object-cover shadow-lg"
              />
              <p className="mt-2 text-center text-xs font-bold">ატვირთვა ✓</p>
            </div>
            <div className="hero-phone-scene hero-phone-scene-3 flex flex-col items-center justify-center gap-2 p-4">
              <div className="hero-confetti pointer-events-none absolute inset-0" />
              <p className="relative z-10 text-lg font-display font-bold text-gradient">გმადლობთ!</p>
              <p className="relative z-10 text-[10px] text-[var(--muted)]">ალბომშია</p>
            </div>
            <div className="hero-phone-scene hero-phone-scene-4 p-2">
              <div className="rounded-xl bg-[var(--surface-dark)] p-1">
                <p className="mb-1 text-center text-[9px] font-bold text-pink-300">ლაივ სლაიდშოუ</p>
                <Image
                  src="/seed-samples/wedding-1.jpg"
                  alt=""
                  width={260}
                  height={180}
                  className="h-32 w-full rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-2 top-1/4 hidden rotate-6 rounded-2xl border-2 border-white bg-white p-2 shadow-lg md:block">
        <Image src="/seed-samples/wedding-6.jpg" alt="" width={80} height={100} className="rounded-lg object-cover" />
      </div>
      <div className="absolute -left-3 bottom-1/4 hidden -rotate-3 rounded-2xl border-2 border-white bg-white p-2 shadow-lg md:block">
        <Image src="/seed-samples/wedding-2.jpg" alt="" width={72} height={96} className="rounded-lg object-cover" />
      </div>
    </div>
  );
}
