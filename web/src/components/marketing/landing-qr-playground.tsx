"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { CardTemplate } from "@/lib/qr-card";

const DEMO_SLUG = "memento-demo-guest-01";

const templates: {
  id: CardTemplate;
  label: string;
  preview: "bright" | "gradient" | "photo";
}[] = [
  { id: "botanical", label: "ფერადი", preview: "bright" },
  { id: "elegant", label: "მუქი · ნეონი", preview: "gradient" },
  { id: "minimal", label: "ფოტო", preview: "photo" },
];

export function LandingQrPlayground() {
  const [active, setActive] = useState<CardTemplate>("botanical");
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  const guestUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `https://memento.ge/e/${DEMO_SLUG}`;
    }
    return `${window.location.origin}/e/${DEMO_SLUG}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(guestUrl, {
      width: 280,
      margin: 1,
      color: { dark: "#121212", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrSrc(url);
      })
      .catch(() => {
        if (!cancelled) setQrSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guestUrl, active]);

  const tpl = templates.find((x) => x.id === active)!;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="type-label">QR ბარათი</p>
        <h2 className="type-section-title mt-2">აირჩიე სტილი — ფერი იცვლება მაშინვე</h2>
        <p className="type-body-lg mt-3">
          სამი ბეჭდვადი შაბლონი ქორწილის მაგიდისთვის. PDF ან PNG ერთი კლიკით.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-bold transition",
                active === t.id ? "btn-gradient" : "card-chunky border border-[var(--border-soft)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tpl.preview === "bright" && (
        <div
          className="card-chunky relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden border border-[var(--accent-sky)]/40 bg-[var(--bg-lime-wash)] p-6"
          data-testid="qr-card-preview"
        >
          <span className="absolute left-4 top-4 text-2xl font-bold text-[var(--accent)]" aria-hidden>
            ✦
          </span>
          <span className="absolute right-4 top-6 text-2xl font-bold text-[var(--accent-amber)]" aria-hidden>
            ✦
          </span>
          <span className="absolute bottom-6 right-5 text-2xl font-bold text-[var(--accent-sky)]" aria-hidden>
            ✦
          </span>
          <div className="flex h-full flex-col items-center justify-between rounded-2xl border-2 border-[var(--accent)]/50 bg-white/90 p-6 text-center shadow-inner">
            <p className="font-display text-xl font-bold text-[var(--fg)]">ნინო &amp; გიორგი</p>
            <p className="text-sm font-semibold text-[var(--accent-amber)]">14 ივნისი, 2026</p>
            <QrImage src={qrSrc} ringClass="border-[var(--accent-sky)]" />
            <p className="text-xs font-bold text-[var(--muted)]">QR · ატვირთე ფოტო</p>
            <p className="font-display text-sm font-bold text-[var(--fg)]">memento.ge</p>
          </div>
        </div>
      )}

      {tpl.preview === "gradient" && (
        <div
          className="card-chunky relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden border border-[var(--accent)]/30 bg-[var(--bg-charcoal)] p-6"
          data-testid="qr-card-preview"
        >
          <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-[var(--accent)]/25 bg-[var(--bg-charcoal-elevated)] p-6 text-center">
            <p className="font-display text-xl font-bold text-white">ნინო &amp; გიორგი</p>
            <p className="text-sm text-[var(--accent)]">14 ივნისი, 2026</p>
            <QrImage src={qrSrc} ringClass="border-[var(--accent)]" />
            <p className="text-xs font-bold text-[var(--muted-on-dark)]">QR · ატვირთე ფოტო</p>
            <p className="font-display text-sm font-bold text-[var(--accent)]">memento.ge</p>
          </div>
        </div>
      )}

      {tpl.preview === "photo" && (
        <div
          className="card-chunky relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden bg-[var(--bg-charcoal)] p-4"
          data-testid="qr-card-preview"
        >
          <div className="relative mb-3 h-[38%] overflow-hidden rounded-xl">
            <Image
              src="/seed-samples/wedding-6.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="320px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-charcoal)] to-transparent" />
          </div>
          <div className="flex flex-col items-center gap-3 px-2 pb-2 text-center">
            <p className="font-display text-lg font-bold text-white">ნინო &amp; გიორგი</p>
            <p className="text-xs text-[var(--accent-sky)]">14 ივნისი, 2026</p>
            <QrImage src={qrSrc} dark />
            <p className="text-xs font-bold text-white/90">დაასკანერე · გაგვიზიარე ფოტო ✨</p>
          </div>
        </div>
      )}
    </div>
  );
}

function QrImage({
  src,
  dark,
  ringClass,
}: {
  src: string | null;
  dark?: boolean;
  ringClass?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-36 w-36 place-items-center rounded-2xl border-4 bg-white p-2",
        dark ? "border-[var(--accent-sky)]/60" : ringClass ?? "border-[var(--accent)]/40",
      )}
      data-testid="qr-preview"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="QR კოდი" className="h-full w-full object-contain" />
      ) : (
        <div className="h-24 w-24 animate-pulse rounded-lg bg-[var(--muted)]/20" />
      )}
    </div>
  );
}
