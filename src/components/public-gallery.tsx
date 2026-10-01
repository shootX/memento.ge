"use client";

import { useEffect, useState } from "react";

export function PublicGallery({ slug }: { slug: string }) {
  const [locked, setLocked] = useState(false);
  const [coupleNames, setCoupleNames] = useState("");
  const [items, setItems] = useState<
    { url: string; thumbUrl: string | null; guestName: string | null }[]
  >([]);
  const [password, setPassword] = useState("");

  const load = async () => {
    const res = await fetch(`/api/gallery/${slug}`);
    const data = await res.json();
    if (data.locked) {
      setLocked(true);
      setCoupleNames(data.coupleNames);
      return;
    }
    if (!res.ok) return;
    setCoupleNames(data.coupleNames);
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, [slug]);

  const unlock = async () => {
    const res = await fetch(`/api/gallery/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLocked(false);
      void load();
    }
  };

  if (locked) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-cream)]">
        <div className="w-full max-w-sm rounded-2xl border bg-white/80 p-8">
          <h1 className="font-display text-xl">{coupleNames}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">პაროლი საჭიროა</p>
          <input
            type="password"
            className="mt-4 w-full rounded-xl border px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void unlock()}
            className="mt-3 w-full rounded-full bg-[var(--color-forest)] text-white py-2.5"
          >
            შესვლა
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--color-cream)] to-white px-4 py-12">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-display text-3xl">{coupleNames}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">საჯარე ალბომი</p>
      </div>
      <div className="mx-auto max-w-5xl mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((m, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-xl shadow-sm">
            <img src={m.thumbUrl ?? m.url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </main>
  );
}
