"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Locale, t } from "@/lib/i18n";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMotionSafe } from "@/lib/motion";
import { enqueueUpload } from "@/lib/offline-upload-queue";
import type { GuestEventPayload } from "@/lib/guest-event-payload";

type EventInfo = GuestEventPayload;

type FileProgress = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  preview?: string;
};

async function uploadWithRetry(
  slug: string,
  file: File,
  guestName: string,
  guestKey: string,
  onProgress: (p: number) => void,
  maxRetries = 4,
) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      onProgress(10);
      const form = new FormData();
      form.append("file", file);
      if (guestName) form.append("guestName", guestName);
      form.append("guestKey", guestKey);
      const res = await fetch(`/api/guest/${slug}/upload`, {
        method: "POST",
        body: form,
      });
      onProgress(90);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      onProgress(100);
      return;
    } catch (e) {
      attempt += 1;
      if (attempt > maxRetries) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

export function GuestUpload({
  slug,
  initialInfo = null,
}: {
  slug: string;
  initialInfo?: EventInfo | null;
}) {
  const { spring, reduce } = useMotionSafe();
  const [locale, setLocale] = useState<Locale>("ka");
  const [info, setInfo] = useState<EventInfo | null>(initialInfo);
  const [loading, setLoading] = useState(!initialInfo);
  const [guestName, setGuestName] = useState("");
  const [queue, setQueue] = useState<FileProgress[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [guestKey, setGuestKey] = useState("");
  const [guestbookText, setGuestbookText] = useState("");
  const [tab, setTab] = useState<"photos" | "book">("photos");

  useEffect(() => {
    const k = localStorage.getItem(`memento_gk_${slug}`) ?? crypto.randomUUID();
    localStorage.setItem(`memento_gk_${slug}`, k);
    setGuestKey(k);
    fetch(`/api/guest/${slug}?guestKey=${encodeURIComponent(k)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setInfo(d);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!allDone || reduce) return;
    const done = queue.length > 0 && queue.every((q) => q.status === "done");
    if (!done) return;
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["#ff2d8a", "#ff6b35", "#a855f7", "#fbbf24"],
    });
  }, [allDone, queue, reduce]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!info?.canUpload) return;
      const list = Array.from(files).slice(0, 20);
      const prepared: File[] = [];

      for (const f of list) {
        if (f.type.startsWith("image/") && f.size > 2 * 1024 * 1024) {
          try {
            const compressed = await imageCompression(f, {
              maxSizeMB: 2,
              maxWidthOrHeight: 2048,
              useWebWorker: true,
            });
            prepared.push(compressed);
          } catch {
            prepared.push(f);
          }
        } else {
          prepared.push(f);
        }
      }

      const initial: FileProgress[] = prepared.map((file) => ({
        file,
        status: "pending",
        progress: 0,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      }));
      setQueue(initial);
      setAllDone(false);

      const offline = typeof navigator !== "undefined" && !navigator.onLine;

      for (let i = 0; i < prepared.length; i++) {
        const file = prepared[i];
        if (offline) {
          await enqueueUpload({
            slug,
            guestName,
            guestKey,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            blob: file,
          });
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "done", progress: 100 } : item,
            ),
          );
          continue;
        }

        setQueue((q) =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: "uploading" } : item,
          ),
        );
        try {
          await uploadWithRetry(slug, file, guestName, guestKey, (p) => {
            setQueue((q) =>
              q.map((item, idx) => (idx === i ? { ...item, progress: p } : item)),
            );
          });
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "done", progress: 100 } : item,
            ),
          );
        } catch {
          await enqueueUpload({
            slug,
            guestName,
            guestKey,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            blob: file,
          });
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "done", progress: 100 } : item,
            ),
          );
        }
      }
      setAllDone(true);
      window.dispatchEvent(new CustomEvent("memento-queue-flush"));
    },
    [guestName, guestKey, info?.canUpload, slug],
  );

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        data-testid="guest-loading"
      >
        <Loader2 className="h-10 w-10 animate-spin text-[var(--pink)]" />
      </div>
    );
  }

  if (!info) {
    return (
      <p className="text-center p-8 font-bold" data-testid="guest-error">
        ღონისძიება ვერ მოიძებნა 😢
      </p>
    );
  }

  const closed = !info.canUpload;
  const disposable = info.disposable?.enabled;
  const shotsLeft = info.limits.shotsRemaining;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[var(--bg-page)]"
      data-testid="guest-ready"
    >
      <div className="blob blob-1" aria-hidden />
      <div className="blob blob-2" aria-hidden />

      <div className="relative container-narrow pb-14 pt-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold text-gradient">მემენტო</span>
          <LocaleToggle value={locale} onChange={setLocale} />
        </div>

        {info.branding?.logoUrl && (
          <img
            src={info.branding.logoUrl}
            alt=""
            className="mb-3 h-10 object-contain"
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="card-chunky overflow-hidden"
        >
          {info.coverUrl && (
            <div
              className="h-44 w-full bg-pink-100"
              style={{
                backgroundImage: `url(${info.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          <div className="p-5">
            <p className="type-label">{t(locale, "eventLabel")}</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-snug">{info.coupleNames}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]" suppressHydrationWarning>
              {new Date(info.eventDate).toLocaleDateString(
                locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-GB",
                { dateStyle: "long" },
              )}
            </p>
          </div>
        </motion.div>

        {disposable && shotsLeft !== null && (
          <motion.div
            className="mt-5 rounded-3xl border-4 border-[var(--text-ink)] bg-[#1a1025] p-5 text-white shadow-[6px_6px_0_#ff2d8a]"
            animate={reduce ? {} : { scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <p className="text-center text-xs font-bold uppercase tracking-widest text-pink-300">
              {t(locale, "shotsRemaining")}
            </p>
            <p className="mt-2 text-center font-display text-5xl font-bold">
              {shotsLeft}
            </p>
            <p className="text-center text-sm text-pink-100">კადარი დარჩა</p>
            <div className="mt-4 flex justify-center gap-1">
              {Array.from({ length: info.disposable.shotsPerGuest }).map((_, i) => {
                const used = info.disposable!.shotsPerGuest - (shotsLeft ?? 0);
                return (
                  <div
                    key={i}
                    className={cn(
                      "film-strip-dot h-10 w-8 rounded-sm border-2 border-white/20 bg-black/50",
                      i < used && "bg-[var(--accent)]/90",
                    )}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="mt-5 flex gap-2">
          {(["photos", "book"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-bold transition",
                tab === id ? "btn-gradient text-white" : "bg-white card-chunky border-0 shadow-none",
              )}
            >
              {id === "photos" ? t(locale, "photosTab") : t(locale, "guestbookTab")}
            </button>
          ))}
        </div>

        {tab === "book" ? (
          <div className="mt-6 card-chunky space-y-3 p-5">
            <textarea
              className="w-full rounded-2xl border-2 border-pink-100 px-4 py-3 min-h-[120px] outline-none focus:border-[var(--pink)]"
              placeholder="თქვენი სიყვარულის სიტყვა… 💕"
              value={guestbookText}
              onChange={(e) => setGuestbookText(e.target.value)}
            />
            <Button
              type="button"
              className="btn-gradient w-full border-0"
              onClick={async () => {
                await fetch(`/api/guest/${slug}/guestbook`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ body: guestbookText, guestName }),
                });
                setGuestbookText("");
              }}
            >
              გაგზავნა ✨
            </Button>
          </div>
        ) : closed ? (
          <div className="mt-6 card-chunky p-8 text-center">
            <p className="font-bold text-lg">
              {!info.isActive ? t(locale, "eventClosed") : t(locale, "limitReached")}
            </p>
          </div>
        ) : allDone && queue.every((q) => q.status === "done") ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="mt-6 card-chunky flex flex-col items-center gap-3 p-8 text-center"
          >
            <CheckCircle2 className="h-14 w-14 text-[var(--mint)]" />
            <p className="text-xl font-extrabold">{t(locale, "thanks")}</p>
            <p className="text-sm text-[var(--text-muted)]">{t(locale, "thanksSub")}</p>
            <Button
              type="button"
              className="btn-gradient border-0"
              onClick={() => {
                setQueue([]);
                setAllDone(false);
              }}
            >
              {t(locale, "uploadMore")}
            </Button>
          </motion.div>
        ) : (
          <>
            <p className="mt-5 font-bold">{t(locale, "uploadTitle")}</p>
            <p className="text-sm text-[var(--text-muted)]">{t(locale, "uploadSubtitle")}</p>

            <label className="mt-3 block text-sm font-medium">
              {t(locale, "yourName")}
              <input
                className="mt-1 w-full rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 outline-none focus:border-[var(--pink)]"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={80}
              />
            </label>

            <label className="mt-8 flex flex-col items-center gap-4">
              <span className="guest-shutter flex h-32 w-32 cursor-pointer items-center justify-center rounded-full btn-gradient transition active:scale-95">
                <Camera className="h-14 w-14 text-white" />
              </span>
              <span className="text-center text-lg font-bold">{t(locale, "dropHere")}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                multiple={!disposable}
                className="hidden"
                onChange={(e) => e.target.files && processFiles(e.target.files)}
              />
            </label>

            {queue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <p className="type-label mb-3">ალბომში ფრინვა…</p>
                <ul className="grid grid-cols-3 gap-2">
                  {queue.map((item, i) => (
                    <li
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-2xl border-2 border-[var(--accent)]/30 bg-white shadow-md"
                    >
                      {item.preview && (
                        <motion.img
                          src={item.preview}
                          alt=""
                          className="h-full w-full object-cover"
                          initial={reduce ? false : { scale: 1.2, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={spring}
                        />
                      )}
                      {item.status === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {item.status === "done" && (
                        <span className="absolute right-1 top-1 rounded-full bg-[var(--success)] px-1.5 text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-pink-100">
                        <div
                          className="h-full btn-gradient transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </>
        )}

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          {t(locale, "weakWifi")} 📶
        </p>
      </div>
    </div>
  );
}
