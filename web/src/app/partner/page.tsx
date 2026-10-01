"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColorfulShell } from "@/components/colorful-shell";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

type PartnerData = {
  name: string;
  creditsBalance: number;
  commissionRate: number;
  whiteLabel?: boolean;
  primaryColor?: string;
  events: { id: string; coupleNames: string; isPaid: boolean }[];
};

export default function PartnerPage() {
  const [data, setData] = useState<PartnerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/partner/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d.partner);
      });
  }, []);

  const buyCredits = async () => {
    await fetch("/api/partner/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits: 5, provider: "manual" }),
    });
    window.location.reload();
  };

  if (error) {
    return (
      <ColorfulShell className="flex flex-col items-center justify-center p-12 text-center">
        <SiteHeader />
        <p className="mt-12 text-[var(--text-muted)]">{error}</p>
        <Link href="/login" className="mt-4 font-bold text-[var(--pink)] underline">შესვლა</Link>
      </ColorfulShell>
    );
  }

  if (!data) {
    return (
      <ColorfulShell className="flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-[var(--pink)]" />
      </ColorfulShell>
    );
  }

  return (
    <ColorfulShell>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-4xl font-bold">{data.name} 🤝</h1>
        <p className="text-[var(--text-muted)] mt-1">Partner Studio · white-label</p>
        <Button
          type="button"
          className="btn-gradient mt-6 border-0"
          onClick={() => void buyCredits()}
        >
          +5 კრედიტი (stub)
        </Button>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "კრედიტები", value: data.creditsBalance, emoji: "💳" },
            { label: "კომისია", value: `${Math.round(data.commissionRate * 100)}%`, emoji: "📈" },
            { label: "ღონისძიებები", value: data.events.length, emoji: "🎊" },
          ].map((s) => (
            <div key={s.label} className="card-chunky p-6">
              <span className="text-2xl">{s.emoji}</span>
              <p className="text-xs font-bold uppercase text-[var(--text-muted)] mt-2">{s.label}</p>
              <p className="text-3xl font-extrabold">{s.value}</p>
            </div>
          ))}
        </div>
        <ul className="mt-8 space-y-3">
          {data.events.map((e) => (
            <li key={e.id} className="card-chunky flex justify-between p-4 font-medium">
              {e.coupleNames}
              <span>{e.isPaid ? "✅" : "⏳"}</span>
            </li>
          ))}
        </ul>
      </main>
    </ColorfulShell>
  );
}
