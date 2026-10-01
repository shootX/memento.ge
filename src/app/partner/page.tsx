"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PartnerData = {
  name: string;
  creditsBalance: number;
  commissionRate: number;
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

  if (error) {
    return (
      <main className="p-12 text-center max-w-md mx-auto">
        <p className="text-[var(--color-muted)]">{error}</p>
        <Link href="/login" className="underline mt-4 inline-block">შესვლა</Link>
      </main>
    );
  }

  const buyCredits = async () => {
    await fetch("/api/partner/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits: 5, provider: "manual" }),
    });
    window.location.reload();
  };

  if (!data) return <p className="p-12 text-center animate-pulse">იტვირთება…</p>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-3xl">{data.name}</h1>
      <p className="text-[var(--color-muted)] mt-1">Partner Studio</p>
      <button
        type="button"
        onClick={() => void buyCredits()}
        className="mt-6 rounded-full bg-[var(--color-forest)] text-white px-6 py-2.5 text-sm"
      >
        +5 კრედიტის შეძენა (stub)
      </button>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white/70 p-6">
          <p className="text-xs uppercase text-[var(--color-muted)]">კრედიტები</p>
          <p className="text-3xl font-semibold mt-1">{data.creditsBalance}</p>
        </div>
        <div className="rounded-2xl border bg-white/70 p-6">
          <p className="text-xs uppercase text-[var(--color-muted)]">კომისია</p>
          <p className="text-3xl font-semibold mt-1">{Math.round(data.commissionRate * 100)}%</p>
        </div>
        <div className="rounded-2xl border bg-white/70 p-6">
          <p className="text-xs uppercase text-[var(--color-muted)]">ღონისძიებები</p>
          <p className="text-3xl font-semibold mt-1">{data.events.length}</p>
        </div>
      </div>
      <h2 className="font-display text-xl mt-10">ბოლო ღონისძიებები</h2>
      <ul className="mt-4 space-y-2">
        {data.events.map((e) => (
          <li key={e.id} className="rounded-xl border px-4 py-3 flex justify-between">
            <span>{e.coupleNames}</span>
            <span className="text-xs text-[var(--color-muted)]">{e.isPaid ? "გადახდილი" : "—"}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
