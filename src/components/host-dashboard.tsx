"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Loader2,
  Presentation,
  Trash2,
  QrCode,
  Images,
  Settings2,
  BookHeart,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/cn";
import { HostSettings } from "@/components/host-settings";
import { PhotoLightbox, type LightboxItem } from "@/components/photo-lightbox";
import { useMotionSafe } from "@/lib/motion";

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

type MediaItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  mimeType: string;
  guestName: string | null;
  status: string;
};

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
  { id: "guestbook", label: "Guestbook", icon: BookHeart },
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

export function HostDashboard({
  token,
  bootstrap = null,
}: {
  token: string;
  bootstrap?: Bootstrap | null;
}) {
  const { spring } = useMotionSafe();
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
  const [tab, setTab] = useState<Tab>("gallery");
  const [activeTemplate, setActiveTemplate] =
    useState<(typeof templates)[number]["id"]>("elegant");
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const load = useCallback(async () => {
    try {
      const [ev, med, msg] = await Promise.all([
        fetch(`/api/host/${token}`).then((r) => r.json()),
        fetch(`/api/host/${token}/media`).then((r) => r.json()),
        fetch(`/api/host/${token}/guestbook`).then((r) => r.json()),
      ]);
      if (!ev.error) setEvent(ev);
      if (!med.error) setMedia(med.items ?? []);
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

  return (
    <div className="min-h-screen bg-[var(--bg-page)]" data-testid="host-ready">
      <PhotoLightbox item={lightbox} onClose={() => setLightbox(null)} />
      <header className="border-b-2 border-pink-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-2xl font-bold text-gradient">
              Momenti
            </p>
            <h1 className="text-xl font-extrabold">{event.coupleNames}</h1>
            <p className="text-sm text-[var(--text-muted)]" suppressHydrationWarning>
              {new Date(event.eventDate).toLocaleDateString("ka-GE")} ·{" "}
              {plan?.nameKa ?? event.planTier}
              {!event.isPaid && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  გადაუხდელი
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={event.guestUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" /> სტუმარი
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={event.slideshowUrl} target="_blank" rel="noreferrer">
                <Presentation className="mr-1 h-4 w-4" /> სლაიდშოუ
              </a>
            </Button>
            <Button size="sm" className="btn-gradient border-0" onClick={downloadZip}>
              <Download className="mr-1 h-4 w-4" /> ZIP
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
                tab === t.id
                  ? "btn-gradient text-white"
                  : "bg-pink-50 text-[var(--text-muted)] hover:bg-pink-100",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "ატვირთვები", value: event.usage.uploadCount, emoji: "📸" },
            {
              label: "ლიმიტი",
              value: `${event.usage.uploadCount}/${event.usage.maxUploads}`,
              emoji: "🎯",
            },
            { label: "ფასი", value: `${event.usage.priceGel} ₾`, emoji: "💜" },
          ].map((s) => (
            <div
              key={s.label}
              className="card-chunky flex items-center gap-4 p-5"
            >
              <span className="text-3xl">{s.emoji}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  {s.label}
                </p>
                <p className="text-2xl font-extrabold">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 h-3 overflow-hidden rounded-full bg-pink-100">
          <motion.div
            className="h-full rounded-full btn-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={spring}
          />
        </div>

        {tab === "gallery" && (
          <section>
            {media.length === 0 ? (
              <div className="card-chunky p-12 text-center">
                <p className="text-4xl mb-4">📷</p>
                <p className="text-lg font-bold">ჯერ ფოტო არ არის</p>
                <p className="text-[var(--text-muted)]">
                  QR ბარათი დაუდე მაგიდაზე და სტუმრები ატვირთავენ ✨
                </p>
              </div>
            ) : (
              <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
                {media.map((m, i) => (
                  <motion.button
                    type="button"
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: i * 0.03 }}
                    onClick={() =>
                      setLightbox({
                        id: m.id,
                        url: m.url,
                        guestName: m.guestName,
                      })
                    }
                    className="group relative mb-3 w-full break-inside-avoid overflow-hidden rounded-2xl border-2 border-pink-100 shadow-md text-left"
                  >
                    {m.mimeType.startsWith("video/") ? (
                      <video
                        src={m.url}
                        className="w-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={m.thumbUrl ?? m.url}
                        alt=""
                        className="w-full object-cover"
                      />
                    )}
                    {m.status === "pending" && (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold">
                        მოდერაცია
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMedia(m.id)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-2 opacity-0 shadow transition group-hover:opacity-100"
                      aria-label="წაშლა"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                    {m.guestName && (
                      <p className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 text-xs font-medium text-white">
                        {m.guestName}
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "qr" && (
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="card-chunky p-6">
              <h2 className="mb-4 text-lg font-extrabold">აირჩიე სტილი 🎨</h2>
              <div className="grid gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTemplate(t.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-bold transition",
                      activeTemplate === t.id
                        ? "border-[var(--pink)] bg-pink-50"
                        : "border-transparent bg-gray-50",
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
