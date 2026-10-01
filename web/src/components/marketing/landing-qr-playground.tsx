"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const templates = [
  { id: "elegant", label: "გრადიენტი", from: "#ff2d8a", mid: "#ff6b35", to: "#a855f7" },
  { id: "botanical", label: "სტიკერი", from: "#34d399", mid: "#ff6b35", to: "#ff2d8a" },
  { id: "minimal", label: "ფოტო", from: "#1a1025", mid: "#6b5f7a", to: "#ff2d8a" },
] as const;

export function LandingQrPlayground() {
  const [active, setActive] = useState<(typeof templates)[number]["id"]>("elegant");
  const t = templates.find((x) => x.id === active)!;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="type-label">QR ბარათი</p>
        <h2 className="type-section-title mt-2">აირჩიე სტილი — ფერი იცვლება მაშინვე</h2>
        <p className="type-body-lg mt-3">
          სამი ბეჭდვადი შაბლონი ქორწილის მაგიდისთვის. PDF ან PNG ერთი კლიკით.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setActive(tpl.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-bold transition",
                active === tpl.id ? "btn-gradient text-white" : "card-chunky",
              )}
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="card-chunky relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden p-6 transition-[background] duration-500"
        style={{
          background: `linear-gradient(145deg, ${t.from} 0%, ${t.mid} 45%, ${t.to} 100%)`,
        }}
      >
        <div className="flex h-full flex-col items-center justify-between rounded-2xl bg-white/95 p-6 text-center shadow-inner">
          <p className="font-display text-xl font-bold text-[var(--fg)]">ნინო &amp; გიორგი</p>
          <p className="text-sm text-[var(--muted)]">14 ივნისი, 2026</p>
          <div
            className="grid h-36 w-36 place-items-center rounded-2xl border-4 border-dashed border-[var(--accent)]/40 bg-[var(--bg)]"
            aria-hidden
          >
            <div className="h-24 w-24 rounded-lg bg-[var(--fg)] opacity-90" />
          </div>
          <p className="text-xs font-bold text-[var(--muted)]">QR · ატვირთე ფოტო</p>
          <p className="font-display text-sm font-bold text-gradient">memento.ge</p>
        </div>
      </div>
    </div>
  );
}
