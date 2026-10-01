"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Loader2,
  Presentation,
  Trash2,
  Sparkles,
} from "lucide-react";
import { PLANS, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/cn";
import { HostSettings } from "@/components/host-settings";

type HostEvent = {
  coupleNames: string;
  eventDate: string;
  guestUrl: string;
  slideshowUrl: string;
  isPaid: boolean;
  planTier: PlanTier;
  usage: {
    uploadCount: number;
    totalBytes: number;
    maxUploads: number;
    priceGel: number;
  };
  coverUrl: string | null;
  csrfToken: string;
  customSlug: string | null;
  publicGallery: boolean;
  disposableEnabled: boolean;
  shotsPerGuest: number;
  revealAt: string | null;
  moderateUploads: boolean;
};

type MediaItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  mimeType: string;
  guestName: string | null;
  status: string;
};

const templates = [
  { id: "elegant", label: "Elegant", desc: "კლასიკური ოქრო" },
  { id: "botanical", label: "Botanical", desc: "მწვანე ბოტანიკა" },
  { id: "minimal", label: "Minimal", desc: "მინიმალიზმი" },
] as const;

export function HostDashboard({ token }: { token: string }) {
  const [event, setEvent] = useState<HostEvent | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] =
    useState<(typeof templates)[number]["id"]>("elegant");

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
  const previewUrl = `/api/host/${token}/qr?template=${activeTemplate}&format=png&size=a6`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 animate-fade-up">
      <header className="rounded-3xl border border-[var(--color-border)] bg-white/75 p-6 md:p-10 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
              Host Studio
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2">
              {event.coupleNames}
            </h1>
            <p className="text-[var(--color-muted)] mt-1">
              {new Date(event.eventDate).toLocaleDateString("ka-GE", { dateStyle: "long" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={event.guestUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              სტუმარი
            </a>
            <a
              href={event.slideshowUrl}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-forest)] px-5 py-2.5 text-sm font-medium text-white"
            >
              <Presentation className="h-4 w-4" />
              სლაიდშოუ
            </a>
            <Button type="button" onClick={() => void downloadZip()}>
              <Download className="h-4 w-4" />
              ZIP
            </Button>
          </div>
        </div>

        {!event.isPaid && (
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm flex gap-3">
            <Sparkles className="h-5 w-5 text-amber-700 shrink-0" />
            <span>
              ალბომი ელოდება გადახდას ({event.usage.priceGel} ₾ · {plan.nameKa}). ადმინი ან
              გადახდის webhook აქტივირებს ატვირთვას.
            </span>
          </div>
        )}
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl md:text-2xl">QR ბარათები მაგიდისთვის</h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          აირჩიეთ შაბლონი, გადახედეთ და ჩამოტვირთეთ PDF ან PNG (A6).
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-blush)]/30 p-4 flex items-center justify-center min-h-[420px]">
            <img
              src={previewUrl}
              alt="QR card preview"
              className="max-h-[480px] w-auto rounded-lg shadow-lg"
            />
          </div>
          <div className="space-y-3">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActiveTemplate(tpl.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition",
                  activeTemplate === tpl.id
                    ? "border-[var(--color-gold)] bg-white shadow-sm"
                    : "border-[var(--color-border)] bg-white/60 hover:bg-white",
                )}
              >
                <p className="font-medium">{tpl.label}</p>
                <p className="text-xs text-[var(--color-muted)]">{tpl.desc}</p>
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`/api/host/${token}/qr?template=${activeTemplate}&format=pdf&size=a6&download=1`}
                className="text-center rounded-full bg-[var(--color-ink)] text-white py-2.5 text-sm font-medium"
              >
                PDF ჩამოტვირთვა
              </a>
              <a
                href={`/api/host/${token}/qr?template=${activeTemplate}&format=png&size=a6&download=1`}
                className="text-center rounded-full border border-[var(--color-border)] py-2.5 text-sm font-medium"
              >
                PNG ჩამოტვირთვა
              </a>
            </div>
          </div>
        </div>
      </section>

      <p className="mt-10 text-sm text-[var(--color-muted)]">
        {event.usage.uploadCount} / {event.usage.maxUploads} ატვირთვა ·{" "}
        {(event.usage.totalBytes / (1024 * 1024)).toFixed(1)} MB
      </p>

      <HostSettings
        token={token}
        csrfToken={event.csrfToken}
        initial={{
          disposableEnabled: event.disposableEnabled,
          shotsPerGuest: event.shotsPerGuest,
          revealAt: event.revealAt,
          publicGallery: event.publicGallery,
          customSlug: event.customSlug,
        }}
      />

      {event.customSlug && event.publicGallery && (
        <p className="mt-4 text-sm">
          საჯარე გალერეა:{" "}
          <a className="underline" href={`/gallery/${event.customSlug}`}>
            /gallery/{event.customSlug}
          </a>
        </p>
      )}

      {media.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-white/40 p-12 text-center">
          <p className="font-display text-lg">ჯერ ცარიელია</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            დაბეჭდეთ QR ბარათები — ფოტოები აქ გამოჩნდება
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((m) => (
            <div
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--color-blush)] shadow-sm"
            >
              <img
                src={m.thumbUrl ?? m.url}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              {m.status === "pending" && (
                <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] text-white">
                  მოდერაცია
                </span>
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
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs">
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
