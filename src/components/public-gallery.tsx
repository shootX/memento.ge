"use client";

import { useEffect, useState } from "react";
import { ColorfulShell } from "@/components/colorful-shell";
import { PhotoLightbox, type LightboxItem } from "@/components/photo-lightbox";
import { motion } from "framer-motion";

type GalleryInitial =
  | {
      locked: boolean;
      coupleNames: string;
      items: { id: string; url: string; thumbUrl: string | null; guestName: string | null }[];
    }
  | null;

export function PublicGallery({
  slug,
  initial = null,
}: {
  slug: string;
  initial?: GalleryInitial;
}) {
  const [locked, setLocked] = useState(initial?.locked ?? false);
  const [coupleNames, setCoupleNames] = useState(initial?.coupleNames ?? "");
  const [items, setItems] = useState(initial?.items ?? []);
  const [password, setPassword] = useState("");
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [ready, setReady] = useState(Boolean(initial));

  const load = async () => {
    const res = await fetch(`/api/gallery/${slug}`);
    const data = await res.json();
    if (data.locked) {
      setLocked(true);
      setCoupleNames(data.coupleNames);
      setReady(true);
      return;
    }
    if (!res.ok) {
      setReady(true);
      return;
    }
    setCoupleNames(data.coupleNames);
    setItems(
      (data.items ?? []).map((m: { url: string; thumbUrl: string | null; guestName: string | null }, i: number) => ({
        id: String(i),
        ...m,
      })),
    );
    setReady(true);
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

  if (!ready) {
    return (
      <ColorfulShell className="flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--pink)]" />
      </ColorfulShell>
    );
  }

  if (locked) {
    return (
      <ColorfulShell className="flex items-center justify-center px-4">
        <div className="card-chunky w-full max-w-sm p-8">
          <h1 className="text-2xl font-extrabold">{coupleNames}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">🔒 პაროლი საჭიროა</p>
          <input
            type="password"
            className="mt-4 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void unlock()}
            className="mt-3 w-full rounded-full btn-gradient py-3 font-bold text-white"
          >
            შესვლა
          </button>
        </div>
      </ColorfulShell>
    );
  }

  return (
    <ColorfulShell>
      <PhotoLightbox item={lightbox} onClose={() => setLightbox(null)} />
      <div className="px-4 py-12" data-testid="gallery-ready">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-4xl">💕</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{coupleNames}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">საჯარე ალბომი · მემენტო</p>
        </div>
        <div className="mx-auto max-w-5xl mt-10 columns-2 gap-3 md:columns-3 lg:columns-4">
          {items.map((m, i) => (
            <motion.button
              type="button"
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setLightbox({ id: m.id, url: m.url, guestName: m.guestName })}
              className="mb-3 w-full break-inside-avoid overflow-hidden rounded-2xl border-2 border-[var(--border)] shadow-md"
            >
              <img src={m.thumbUrl ?? m.url} alt="" className="w-full object-cover" />
            </motion.button>
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-center text-[var(--text-muted)] mt-12">ჯერ ფოტო არ არის 📷</p>
        )}
      </div>
    </ColorfulShell>
  );
}
