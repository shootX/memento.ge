"use client";

import Link from "next/link";
import { ColorfulShell } from "@/components/colorful-shell";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { PartnerBootstrap } from "@/lib/partner-bootstrap";

export function PartnerDashboard({
  initial,
  error,
}: {
  initial: PartnerBootstrap | null;
  error: string | null;
}) {
  const data = initial;

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
        <Link href="/login" className="mt-4 font-bold text-[var(--pink)] underline">
          შესვლა
        </Link>
      </ColorfulShell>
    );
  }

  if (!data) {
    return (
      <ColorfulShell className="flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--pink)]" />
      </ColorfulShell>
    );
  }

  return (
    <ColorfulShell>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12" data-testid="partner-ready">
        <h1 className="break-words font-display text-4xl font-bold">{data.name} 🤝</h1>
        <p className="mt-1 text-[var(--text-muted)]">Partner Studio · white-label</p>
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
              <p className="mt-2 text-xs font-bold uppercase text-[var(--text-muted)]">{s.label}</p>
              <p className="text-3xl font-extrabold">{s.value}</p>
            </div>
          ))}
        </div>
        <ul className="mt-8 space-y-3">
          {data.events.map((e) => (
            <li key={e.id} className="card-chunky flex justify-between gap-3 p-4 font-medium">
              <span className="min-w-0 break-words">{e.coupleNames}</span>
              <span className="shrink-0">{e.isPaid ? "✅" : "⏳"}</span>
            </li>
          ))}
        </ul>
      </main>
    </ColorfulShell>
  );
}
