"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { Locale, t, uploadErrorMessage } from "@/lib/i18n";
import { formatEventDate } from "@/lib/format-date";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { EventCover } from "@/components/event-cover";
import { useMotionSafe } from "@/lib/motion";
import { enqueueUpload } from "@/lib/offline-upload-queue";
import {
  isFinalUploadHttpStatus,
  parseUploadErrorBody,
  runPool,
  shouldCompressImagesForUpload,
} from "@/lib/guest-upload-http";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { GuestEventPayload } from "@/lib/guest-event-payload";

type EventInfo = GuestEventPayload;

type FileProgress = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  preview?: string;
  errorMessage?: string;
};

class GuestUploadError extends Error {
  readonly code?: string;
  readonly maxBytes?: number;
  readonly final: boolean;

  constructor(
    message: string,
    opts?: { code?: string; maxBytes?: number; final?: boolean },
  ) {
    super(message);
    this.code = opts?.code;
    this.maxBytes = opts?.maxBytes;
    this.final = opts?.final ?? false;
  }
}

function isHeicFile(file: File): boolean {
  const t = file.type.toLowerCase();
  return t === "image/heic" || t === "image/heif" || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

function uploadOnceXhr(
  slug: string,
  file: File,
  guestName: string,
  guestKey: string,
  clientUploadKey: string,
  onProgress: (p: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (guestName) form.append("guestName", guestName);
    form.append("guestKey", guestKey);
    form.append("clientUploadKey", clientUploadKey);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      const data = parseUploadErrorBody(xhr.responseText);
      reject(
        new GuestUploadError(data.error ?? "Upload failed", {
          code: data.code,
          maxBytes: data.maxBytes,
          final: isFinalUploadHttpStatus(xhr.status),
        }),
      );
    });
    xhr.addEventListener("error", () => {
      reject(new GuestUploadError("Network error", { final: false }));
    });
    xhr.open("POST", `/api/guest/${slug}/upload`);
    xhr.send(form);
  });
}

async function uploadWithRetry(
  slug: string,
  file: File,
  guestName: string,
  guestKey: string,
  clientUploadKey: string,
  onProgress: (p: number) => void,
  maxRetries = 4,
) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await uploadOnceXhr(slug, file, guestName, guestKey, clientUploadKey, onProgress);
      return;
    } catch (e) {
      if (e instanceof GuestUploadError && e.final) throw e;
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
  const [guestbookError, setGuestbookError] = useState<string | null>(null);
  const [guestbookOk, setGuestbookOk] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [tab, setTab] = useState<"photos" | "book">("photos");
  const [browserOffline, setBrowserOffline] = useState(false);
  const [uploadDeferred, setUploadDeferred] = useState(false);
  const [touchUi, setTouchUi] = useState(false);

  useEffect(() => {
    setTouchUi(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    const syncOnline = () =>
      setBrowserOffline(typeof navigator !== "undefined" && !navigator.onLine);
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => {
    const cookie = document.cookie.match(/memento_locale=(en|ru|ka)/);
    if (cookie?.[1] === "en" || cookie?.[1] === "ru" || cookie?.[1] === "ka") {
      setLocale(cookie[1]);
    }
  }, []);

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
    localStorage.setItem("memento_guest_has_uploaded", "1");
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["#c4ff0d", "#a8e600", "#c1ff72", "#ffffff"],
    });
  }, [allDone, queue, reduce]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!info?.canUpload) return;
      const maxBytes = info.limits.maxBytesPerFile;
      const list = Array.from(files);
      const compress = shouldCompressImagesForUpload();
      const prepared: { file: File; errorMessage?: string }[] = [];

      for (const f of list) {
        if (f.size > maxBytes) {
          prepared.push({
            file: f,
            errorMessage: uploadErrorMessage(locale, "FILE_TOO_LARGE", maxBytes),
          });
          continue;
        }
        if (
          compress &&
          f.type.startsWith("image/") &&
          !isHeicFile(f) &&
          f.size > 2 * 1024 * 1024
        ) {
          try {
            const compressed = await imageCompression(f, {
              maxSizeMB: 8,
              maxWidthOrHeight: 4096,
              useWebWorker: true,
            });
            prepared.push({ file: compressed });
          } catch {
            prepared.push({ file: f });
          }
        } else {
          prepared.push({ file: f });
        }
      }

      const initial: FileProgress[] = prepared.map(({ file, errorMessage }) => ({
        file,
        status: errorMessage ? "error" : "pending",
        progress: 0,
        errorMessage,
        preview:
          file.type.startsWith("image/") || isHeicFile(file)
            ? URL.createObjectURL(file)
            : undefined,
      }));
      setQueue(initial);
      setAllDone(false);
      setUploadDeferred(false);

      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      if (offline) setUploadDeferred(true);

      const uploadOne = async (entry: { file: File; errorMessage?: string }, i: number) => {
        if (entry.errorMessage) return;

        if (offline) {
          const clientUploadKey = crypto.randomUUID();
          await enqueueUpload({
            slug,
            guestName,
            guestKey,
            clientUploadKey,
            fileName: entry.file.name,
            mimeType: entry.file.type || "application/octet-stream",
            blob: entry.file,
          });
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "done", progress: 100 } : item,
            ),
          );
          return;
        }

        setQueue((q) =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: "uploading", progress: 0 } : item,
          ),
        );
        try {
          const clientUploadKey = crypto.randomUUID();
          await uploadWithRetry(slug, entry.file, guestName, guestKey, clientUploadKey, (p) => {
            setQueue((q) =>
              q.map((item, idx) => (idx === i ? { ...item, progress: p } : item)),
            );
          });
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "done", progress: 100 } : item,
            ),
          );
        } catch (e) {
          if (e instanceof GuestUploadError && e.final) {
            const msg = uploadErrorMessage(locale, e.code, e.maxBytes ?? maxBytes);
            setQueue((q) =>
              q.map((item, idx) =>
                idx === i ? { ...item, status: "error", progress: 0, errorMessage: msg } : item,
              ),
            );
            return;
          }
          setUploadDeferred(true);
          const clientUploadKey = crypto.randomUUID();
          await enqueueUpload({
            slug,
            guestName,
            guestKey,
            clientUploadKey,
            fileName: entry.file.name,
            mimeType: entry.file.type || "application/octet-stream",
            blob: entry.file,
          });
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "done", progress: 100 } : item,
            ),
          );
        }
      };

      await runPool(prepared, 3, (entry, i) => uploadOne(entry, i));

      setAllDone(true);
      window.dispatchEvent(new CustomEvent("memento-queue-flush"));
    },
    [guestName, guestKey, info?.canUpload, info?.limits.maxBytesPerFile, locale, slug],
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
  const doneCount = queue.filter((q) => q.status === "done").length;
  const showWeakConnectionBanner =
    browserOffline || (uploadDeferred && queue.some((q) => q.status === "done"));

  return (
    <div
      className="relative min-h-screen overflow-hidden guest-page-bg"
      data-testid="guest-ready"
    >
      <a href="#guest-main" className="skip-link">
        ატვირთვის ზონა
      </a>
      <div className="blob blob-1 opacity-40" aria-hidden />
      <div className="blob blob-2 opacity-35" aria-hidden />

      <div id="guest-main" className="relative container-narrow pb-14 pt-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold text-[var(--fg)]">მემენტო</span>
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
          <EventCover coverUrl={info.coverUrl} coupleNames={info.coupleNames} />
          <div className="p-5">
            <p className="type-label">{t(locale, "eventLabel")}</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-snug">{info.coupleNames}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]" suppressHydrationWarning>
              {formatEventDate(info.eventDate, locale)}
            </p>
            {info.publicGallery && (
              <Link
                href={`/gallery/${info.gallerySlug}`}
                className="mt-3 inline-block text-sm font-bold text-[var(--accent)] underline-offset-2 hover:underline"
              >
                {t(locale, "viewPublicAlbum")} →
              </Link>
            )}
          </div>
        </motion.div>

        {disposable && shotsLeft !== null && (
          <motion.div
            className="guest-shots-card mt-5 rounded-3xl border border-white/15 p-5 text-white shadow-lg"
            animate={reduce ? {} : { scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <p className="text-center text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              {t(locale, "shotsRemaining")}
            </p>
            <p className="mt-2 text-center font-display text-5xl font-bold">{shotsLeft}</p>
            <p className="text-center text-sm font-medium text-white/90">{t(locale, "shotLeft")}</p>
            <div className="mt-4 flex justify-center gap-1.5">
              {Array.from({ length: info.disposable.shotsPerGuest }).map((_, i) => {
                const remaining = shotsLeft ?? 0;
                const used = info.disposable!.shotsPerGuest - remaining;
                const isRemaining = i >= used;
                return (
                  <div
                    key={i}
                    className={cn(
                      "film-strip-dot h-11 w-9 rounded-md border-2 transition",
                      isRemaining
                        ? "border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_12px_rgba(196,255,13,0.45)]"
                        : "border-white/25 bg-white/10 opacity-50",
                    )}
                    aria-hidden
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="mt-5 flex gap-2" role="tablist" aria-label="Guest upload sections">
          {(["photos", "book"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-bold transition",
                tab === id ? "btn-gradient" : "card-chunky border border-[var(--border-soft)]",
              )}
            >
              {id === "photos" ? t(locale, "photosTab") : t(locale, "guestbookTab")}
            </button>
          ))}
        </div>

        {tab === "book" ? (
          <div className="mt-6 card-chunky space-y-3 p-5">
            <label className="block text-sm font-medium">
              {t(locale, "guestbookName")}
              <input
                className="mt-1 w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--fg)] outline-none focus:border-[var(--accent)]"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={80}
              />
            </label>
            <textarea
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 min-h-[120px] text-[var(--fg)] outline-none focus:border-[var(--accent)]"
              placeholder={t(locale, "guestbookPlaceholder")}
              value={guestbookText}
              onChange={(e) => setGuestbookText(e.target.value)}
            />
            <Button
              type="button"
              className="btn-gradient w-full border-0"
              onClick={async () => {
                setGuestbookError(null);
                setGuestbookOk(false);
                const res = await fetch(`/api/guest/${slug}/guestbook`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ body: guestbookText, guestName }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setGuestbookError(data.error ?? t(locale, "guestbookForbidden"));
                  return;
                }
                setGuestbookText("");
                setGuestbookOk(true);
              }}
            >
              {t(locale, "sendGuestbook")}
            </Button>
            {guestbookError && (
              <p className="text-sm font-semibold text-red-600">{guestbookError}</p>
            )}
            {guestbookOk && (
              <p className="text-sm font-semibold text-[var(--success)]">{t(locale, "guestbookSent")}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                if (recording && recorder) {
                  recorder.stop();
                  return;
                }
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const mr = new MediaRecorder(stream);
                  const chunks: BlobPart[] = [];
                  mr.ondataavailable = (e) => chunks.push(e.data);
                  mr.onstop = async () => {
                    stream.getTracks().forEach((t) => t.stop());
                    setRecording(false);
                    const blob = new Blob(chunks, { type: "audio/webm" });
                    const form = new FormData();
                    form.append("audio", blob, "voice.webm");
                    if (guestName) form.append("guestName", guestName);
                    const res = await fetch(`/api/guest/${slug}/guestbook`, {
                      method: "POST",
                      body: form,
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setGuestbookError(data.error ?? t(locale, "guestbookForbidden"));
                      return;
                    }
                    setGuestbookOk(true);
                  };
                  mr.start();
                  setRecorder(mr);
                  setRecording(true);
                } catch {
                  setGuestbookError(t(locale, "guestbookForbidden"));
                }
              }}
            >
              {recording ? t(locale, "stopRecording") : t(locale, "recordVoice")}
            </Button>
          </div>
        ) : closed ? (
          <div className="mt-6 card-chunky p-8 text-center">
            <p className="font-bold text-lg">
              {!info.isPaid && !info.inTrial
                ? t(locale, "eventNotActivated")
                : info.isActive
                  ? t(locale, "limitReached")
                  : t(locale, "eventNotActivated")}
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
            <p className="mt-5 font-bold md:mt-5">{t(locale, "uploadTitle")}</p>
            <p className="text-sm text-[var(--text-muted)]">{t(locale, "uploadSubtitle")}</p>

            <label className="mt-3 block text-sm font-medium">
              {t(locale, "yourName")}
              <input
                className="mt-1 w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--fg)] outline-none focus:border-[var(--accent)]"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={80}
              />
            </label>

            {queue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <p className="type-label mb-3">
                  {t(locale, "albumQueue")}{" "}
                  <span className="text-[var(--fg)]">
                    {t(locale, "uploadProgress", {
                      current: doneCount,
                      total: queue.length,
                    })}
                  </span>
                </p>
                <ul className="grid grid-cols-3 gap-2">
                  {queue.map((item, i) => (
                    <li
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-2xl border-2 border-[var(--accent)]/30 bg-[var(--surface)] shadow-md"
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
                      {item.status === "error" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-2 text-center text-xs font-bold text-white">
                          {item.errorMessage ?? t(locale, "uploadFailed")}
                        </div>
                      )}
                      {item.status === "done" && (
                        <span className="absolute right-1 top-1 rounded-full bg-[var(--success)] px-1.5 text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[var(--bg-muted)]">
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

            <label
              htmlFor="guest-photo-input"
              className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-2 border-t border-[var(--border-soft)] bg-[var(--bg-page)]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:static md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
            >
              <span className="guest-shutter flex h-24 w-24 cursor-pointer items-center justify-center rounded-full btn-gradient transition active:scale-95 md:h-32 md:w-32">
                <Camera className="h-12 w-12 text-[var(--accent-on)] md:h-14 md:w-14" aria-hidden />
              </span>
              <span className="text-center text-base font-bold md:text-lg">
                {t(locale, touchUi ? "dropHereTouch" : "dropHere")}
              </span>
              <input
                id="guest-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
                multiple={!disposable}
                className="sr-only focus-visible:not-sr-only"
                aria-label={t(locale, touchUi ? "dropHereTouch" : "dropHere")}
                onChange={(e) => e.target.files && processFiles(e.target.files)}
              />
            </label>
            <div className="h-36 md:hidden" aria-hidden />
          </>
        )}

        {showWeakConnectionBanner && (
          <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
            {t(locale, "weakWifi")} 📶
          </p>
        )}
      </div>
    </div>
  );
}
