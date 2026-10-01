"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Loader2,
  Presentation,
  Trash2,
} from "lucide-react";
import { PLANS, type PlanTier } from "@/lib/plans";

type HostEvent = {
  coupleNames: string;
  eventDate: string;
  guestUrl: string;
  isPaid: boolean;
  isActive: boolean;
  planTier: PlanTier;
  usage: {
    uploadCount: number;
    totalBytes: number;
    maxUploads: number;
    priceGel: number;
  };
  coverUrl: string | null;
  csrfToken: string;
};

type MediaItem = {
  id: string;
  url: string;
  mimeType: string;
  guestName: string | null;
};

const templates = [
  { id: "elegant", label: "Elegant" },
  { id: "botanical", label: "Botanical" },
  { id: "minimal", label: "Minimal" },
] as const;

export function HostDashboard({ token }: { token: string }) {
  const [event, setEvent] = useState<HostEvent | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ev, med] = await Promise.all([
      fetch(`/api/host/${token}`).then((r) => r.json()),
      fetch(`/api/host/${token}/media`).then((r) => r.json()),
    ]);
    if (!ev.error) setEvent(ev);
    if (!med.error) setMedia(med.items ?? []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  const deleteMedia = async (id: string) => {
    if (!event) return;
    await fetch(`/api/host/${token}/media/${id}`, {
      method: "DELETE",
      headers: { "x-csrf-token": event.csrfToken },
    });
    void load();
  };

  const downloadZip = async () => {
    if (!event) return;
    const res = await fetch(`/api/host/${token}/zip`, {
      headers: { "x-csrf-token": event.csrfToken },
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "album.zip";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-gold)]" />
      </div>
    );
  }

  if (!event) {
    return <p className="p-8 text-center">წვდომა უარყოფილია</p>;
  }

  const plan = PLANS[event.planTier];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 animate-fade-up">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
            Host · Momenti
          </p>
          <h1 className="font-display text-3xl font-semibold">{event.coupleNames}</h1>
          <p className="text-[var(--color-muted)]">
            {new Date(event.eventDate).toLocaleDateString("ka-GE", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={event.guestUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white/60 px-5 py-2.5 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            სტუმრის ლინკი
          </a>
          <a
            href={`/host/${token}/slideshow`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-forest)] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Presentation className="h-4 w-4" />
            სლაიდშოუ
          </a>
          <Button type="button" onClick={() => void downloadZip()}>
            <Download className="h-4 w-4" />
            ZIP
          </Button>
        </div>
      </header>

      {!event.isPaid && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm">
          ალბომი ჯერ არ არის გააქტიურებული. გადახდის შემდეგ ადმინი აქტივირებს (
          {event.usage.priceGel} ₾, {plan.nameKa}).
        </div>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {templates.map((tpl) => (
          <a
            key={tpl.id}
            href={`/api/host/${token}/qr?template=${tpl.id}`}
            className="group rounded-2xl border border-[var(--color-border)] bg-white/70 p-5 transition hover:shadow-md"
          >
            <p className="font-medium">{tpl.label}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">QR ბარათი · PDF</p>
            <span className="mt-3 inline-block text-sm text-[var(--color-forest)] group-hover:underline">
              ჩამოტვირთვა →
            </span>
          </a>
        ))}
      </section>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        {event.usage.uploadCount} / {event.usage.maxUploads} ატვირთვა ·{" "}
        {(event.usage.totalBytes / (1024 * 1024)).toFixed(1)} MB
      </p>

      {media.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-[var(--color-border)] bg-white/40 p-12 text-center">
          <p className="font-display text-lg">ჯერ ცარიელია</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            დაბეჭდეთ QR ბარათები მაგიდებზე — ფოტოები აქ გამოჩნდება
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((m) => (
            <div
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)]"
            >
              {m.mimeType.startsWith("video/") ? (
                <video src={m.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => void deleteMedia(m.id)}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {m.guestName && (
                <span className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-0.5 text-xs">
                  {m.guestName}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
