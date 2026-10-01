"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Loader2,
  Presentation,
  QrCode,
  Images,
  Settings2,
  BookHeart,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/cn";
import { HostSettings } from "@/components/host-settings";
import { PhotoLightbox, type LightboxItem } from "@/components/photo-lightbox";
import { HostMediaGrid, type HostGridMedia } from "@/components/host-media-grid";

type Tab = "gallery" | "qr" | "guestbook" | "settings";

type HostEvent = {
  coupleNames: string;
  eventDate: string;
  guestUrl: string;
  slideshowUrl: string;
  isPaid: boolean;
  planTier: string;
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

type MediaItem = HostGridMedia;

type GuestMsg = {
  id: string;
  guestName: string | null;
  body: string;
  createdAt: string;
};

const templates = [
  { id: "elegant", label: "გრადიენტი", emoji: "🌈" },
  { id: "botanical", label: "სტიკერი", emoji: "✨" },
  { id: "minimal", label: "ფოტო", emoji: "📷" },
] as const;

const tabs: { id: Tab; label: string; icon: typeof Images }[] = [
  { id: "gallery", label: "ფოტოები", icon: Images },
  { id: "qr", label: "QR ბარათი", icon: QrCode },
  { id: "guestbook", label: "სტუმრების წიგნი", icon: BookHeart },
  { id: "settings", label: "პარამეტრები", icon: Settings2 },
];

type Bootstrap = {
  coupleNames: string;
  eventDate: string;
  guestUrl: string;
  slideshowUrl: string;
  isPaid: boolean;
  planTier: string;
  usage: HostEvent["usage"];
  coverUrl: string | null;
  csrfToken: string;
  customSlug: string | null;
  publicGallery: boolean;
  disposableEnabled: boolean;
  shotsPerGuest: number;
  revealAt: string | null;
  moderateUploads: boolean;
  media: MediaItem[];
  messages: GuestMsg[];
};

function parseTab(value: string | null | undefined): Tab {
  if (value === "gallery" || value === "qr" || value === "guestbook" || value === "settings") {
    return value;
  }
  return "gallery";
}

export function HostDashboard({
  token,
  bootstrap = null,
  initialTab = "gallery",
}: {
  token: string;
  bootstrap?: Bootstrap | null;
  initialTab?: Tab;
}) {
  const [event, setEvent] = useState<HostEvent | null>(
    bootstrap
      ? {
          coupleNames: bootstrap.coupleNames,
          eventDate: bootstrap.eventDate,
          guestUrl: bootstrap.guestUrl,
          slideshowUrl: bootstrap.slideshowUrl,
          isPaid: bootstrap.isPaid,
          planTier: bootstrap.planTier,
          usage: bootstrap.usage,
          coverUrl: bootstrap.coverUrl,
          csrfToken: bootstrap.csrfToken,
          customSlug: bootstrap.customSlug,
          publicGallery: bootstrap.publicGallery,
          disposableEnabled: bootstrap.disposableEnabled,
          shotsPerGuest: bootstrap.shotsPerGuest,
          revealAt: bootstrap.revealAt,
          moderateUploads: bootstrap.moderateUploads,
        }
      : null,
  );
  const [media, setMedia] = useState<MediaItem[]>(bootstrap?.media ?? []);
  const [messages, setMessages] = useState<GuestMsg[]>(bootstrap?.messages ?? []);
  const [loading, setLoading] = useState(!bootstrap);
  const [tab, setTab] = useState<Tab>(parseTab(initialTab));
  const [activeTemplate, setActiveTemplate] =
    useState<(typeof templates)[number]["id"]>("elegant");
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [newPulse, setNewPulse] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ev, med, msg] = await Promise.all([
        fetch(`/api/host/${token}`).then((r) => r.json()),
        fetch(`/api/host/${token}/media`).then((r) => r.json()),
        fetch(`/api/host/${token}/guestbook`).then((r) => r.json()),
      ]);
      if (!ev.error) setEvent(ev);
      if (!med.error) {
        setMedia((prev) => {
          const items = (med.items ?? []) as MediaItem[];
          if (items.length > prev.length && prev.length > 0) {
            setNewPulse(true);
            setTimeout(() => setNewPulse(false), 4000);
          }
          return items;
        });
      }
      if (!msg.error) setMessages(msg.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  const toggleHighlight = async (id: string, highlight: boolean) => {
    if (!event) return;
    await fetch(`/api/host/${token}/media/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": event.csrfToken,
      },
      body: JSON.stringify({ highlight }),
    });
    setMedia((items) => items.map((m) => (m.id === id ? { ...m, highlight } : m)));
  };

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--pink)]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-lg font-bold">ლინკი არ მოიძებნა 🔒</p>
      </div>
    );
  }

  const plan = PLANS[event.planTier as keyof typeof PLANS] ?? PLANS.starter;
  const pct = Math.min(
    100,
    (event.usage.uploadCount / event.usage.maxUploads) * 100,
  );
  const eventDay = new Date(event.eventDate);
  const today = new Date();
  const isLive =
    Math.abs(eventDay.getTime() - today.getTime()) < 1000 * 60 * 60 * 24 * 2;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]" data-testid="host-ready">
      <PhotoLightbox item={lightbox} onClose={() => setLightbox(null)} />

      <div className="relative overflow-hidden border-b-2 border-[var(--border-soft)]">
        {event.coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--gradient-soft)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/70 to-black/25" />
        <div className="absolute inset-0 bg-[var(--bg-page)]/15" />
        <div className="container-page relative py-8 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              {isLive ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
                  ლაივ ახლა
                </span>
              ) : (
                <span className="type-label">ღონისძიება</span>
              )}
              <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{event.coupleNames}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]" suppressHydrationWarning>
                {eventDay.toLocaleDateString("ka-GE", { dateStyle: "long" })} · {plan?.nameKa}
                {!event.isPaid && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    გადაუხდელი
                  </span>
                )}
              </p>
            </div>
            {newPulse && (
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--accent)] shadow-md animate-bounce motion-reduce:animate-none">
                ახალი ფოტოები ✨
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={event.slideshowUrl} target="_blank" rel="noreferrer">
                <Presentation className="mr-1 h-4 w-4" /> სლაიდშოუ
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTab("qr")}>
              <QrCode className="mr-1 h-4 w-4" /> QR ბეჭდვა
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={event.guestUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" /> ლინკის გაზიარება
              </a>
            </Button>
            <Button size="sm" className="btn-gradient border-0" onClick={downloadZip}>
              <Download className="mr-1 h-4 w-4" /> ZIP
            </Button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b-2 border-[var(--border-soft)] bg-white/95 backdrop-blur-md">
        <nav className="container-page flex gap-2 overflow-x-auto py-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition",
                tab === t.id
                  ? "btn-gradient text-white"
                  : "bg-[var(--surface-warm)] text-[var(--fg-2)] hover:bg-pink-100",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-page section-y pt-6 pb-10">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "ატვირთვები", value: event.usage.uploadCount },
            {
              label: "ლიმიტი",
              value: `${event.usage.uploadCount}/${event.usage.maxUploads}`,
            },
            { label: "პაკეტი", value: `${event.usage.priceGel} ₾` },
          ].map((s) => (
            <div
              key={s.label}
              className="card-chunky flex flex-col gap-2 p-5"
            >
              <p className="type-label">{s.label}</p>
              <p className="font-display text-3xl font-bold">{s.value}</p>
              {s.label === "ატვირთვები" && (
                <svg viewBox="0 0 80 24" className="h-6 w-full text-[var(--accent)]" aria-hidden>
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points="0,20 15,12 30,16 45,6 60,10 80,4"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6 h-3 overflow-hidden rounded-full bg-pink-100">
          <div
            className="h-full rounded-full btn-gradient transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {tab === "gallery" && (
          <section>
            <HostMediaGrid
              media={media}
              onOpen={(m) =>
                setLightbox({
                  id: m.id,
                  url: m.url,
                  guestName: m.guestName,
                })
              }
              onDelete={deleteMedia}
              onToggleHighlight={toggleHighlight}
            />
          </section>
        )}

        {tab === "qr" && (
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="card-chunky p-6">
              <h2 className="type-section-title text-xl">QR ბარათის სტილი</h2>
              <div className="mt-4 grid gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTemplate(t.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-bold transition",
                      activeTemplate === t.id
                        ? "border-[var(--accent)] bg-[var(--surface-warm)]"
                        : "border-transparent bg-[var(--surface-warm)]/60",
                    )}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button className="btn-gradient border-0" asChild>
                  <a
                    href={`/api/host/${token}/qr?template=${activeTemplate}&format=pdf&download=1`}
                  >
                    PDF
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={`/api/host/${token}/qr?template=${activeTemplate}&format=png&download=1`}
                  >
                    PNG
                  </a>
                </Button>
              </div>
            </div>
            <div className="card-chunky overflow-hidden p-4">
              <img
                src={`/api/host/${token}/qr?template=${activeTemplate}&format=png`}
                alt="QR preview"
                className="mx-auto max-h-[520px] rounded-xl object-contain"
              />
            </div>
          </section>
        )}

        {tab === "guestbook" && (
          <section className="space-y-4">
            {messages.length === 0 ? (
              <div className="card-chunky p-10 text-center">
                <p className="text-4xl">💌</p>
                <p className="mt-2 font-bold">ჯერ შეტყობინება არ არის</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="card-chunky p-5">
                  <p className="font-bold">{m.guestName ?? "სტუმარი"}</p>
                  <p className="mt-2 text-[var(--text-muted)]">{m.body}</p>
                </div>
              ))
            )}
          </section>
        )}

        {tab === "settings" && (
          <HostSettings
            token={token}
            csrfToken={event.csrfToken}
            initial={{
              customSlug: event.customSlug,
              publicGallery: event.publicGallery,
              disposableEnabled: event.disposableEnabled,
              shotsPerGuest: event.shotsPerGuest,
              revealAt: event.revealAt,
            }}
          />
        )}
      </main>
    </div>
  );
}
