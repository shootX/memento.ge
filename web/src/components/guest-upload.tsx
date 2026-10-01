"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { Locale, t } from "@/lib/i18n";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/cn";

type EventInfo = {
  coupleNames: string;
  eventDate: string;
  canUpload: boolean;
  isActive: boolean;
  limits: { maxBytesPerFile: number; shotsRemaining: number | null };
  coverUrl: string | null;
  disposable?: { enabled: boolean; shotsPerGuest: number };
  branding?: { primaryColor?: string; logoUrl?: string | null; partnerName?: string };
};

type FileProgress = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
};

async function uploadWithRetry(
  slug: string,
  file: File,
  guestName: string,
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

export function GuestUpload({ slug }: { slug: string }) {
  const [locale, setLocale] = useState<Locale>("ka");
  const [info, setInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [queue, setQueue] = useState<FileProgress[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [guestKey, setGuestKey] = useState("");
  const [guestbookText, setGuestbookText] = useState("");
  const [tab, setTab] = useState<"photos" | "book">("photos");

  useEffect(() => {
    const k = localStorage.getItem(`momenti_gk_${slug}`) ?? crypto.randomUUID();
    localStorage.setItem(`momenti_gk_${slug}`, k);
    setGuestKey(k);
    fetch(`/api/guest/${slug}?guestKey=${encodeURIComponent(k)}`)
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .finally(() => setLoading(false));
  }, [slug]);

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
      }));
      setQueue(initial);
      setAllDone(false);

      for (let i = 0; i < prepared.length; i++) {
        setQueue((q) =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: "uploading" } : item,
          ),
        );
        try {
          await uploadWithRetry(slug, prepared[i], guestName, (p) => {
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
          setQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "error", progress: 0 } : item,
            ),
          );
        }
      }
      setAllDone(true);
    },
    [guestName, guestKey, info?.canUpload, slug],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-gold)]" />
      </div>
    );
  }

  if (!info) {
    return (
      <p className="text-center text-[var(--color-muted)] p-8">ღონისძიება ვერ მოიძებნა</p>
    );
  }

  const closed = !info.canUpload;

  return (
    <div className="mx-auto max-w-lg px-4 pb-12 pt-6 animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-[var(--color-muted)]">
          Momenti
        </span>
        <LocaleToggle value={locale} onChange={setLocale} />
      </div>

      {info.coverUrl && (
        <div
          className="mb-6 h-40 w-full overflow-hidden rounded-2xl bg-[var(--color-blush)] shadow-inner"
          style={{
            backgroundImage: `url(${info.coverUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
        {info.coupleNames}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {new Date(info.eventDate).toLocaleDateString(
          locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-GB",
          { dateStyle: "long" },
        )}
      </p>

      {info.disposable?.enabled && info.limits.shotsRemaining !== null && (
        <p className="mt-4 rounded-full bg-[var(--color-blush)] px-4 py-2 text-center text-sm">
          📷 Disposable: {info.limits.shotsRemaining} კადარი დარჩა
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("photos")}
          className={cn(
            "flex-1 rounded-full py-2 text-sm",
            tab === "photos" ? "bg-[var(--color-forest)] text-white" : "bg-white/60",
          )}
        >
          ფოტოები
        </button>
        <button
          type="button"
          onClick={() => setTab("book")}
          className={cn(
            "flex-1 rounded-full py-2 text-sm",
            tab === "book" ? "bg-[var(--color-forest)] text-white" : "bg-white/60",
          )}
        >
          Guestbook
        </button>
      </div>

      {tab === "book" ? (
        <div className="mt-6 space-y-3">
          <textarea
            className="w-full rounded-xl border px-4 py-3 min-h-[120px]"
            placeholder="თქვენი სიყვარულის სიტყვა…"
            value={guestbookText}
            onChange={(e) => setGuestbookText(e.target.value)}
          />
          <Button
            type="button"
            onClick={async () => {
              await fetch(`/api/guest/${slug}/guestbook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: guestbookText, guestName }),
              });
              setGuestbookText("");
            }}
          >
            გაგზავნა
          </Button>
        </div>
      ) : (
        <>
      <p className="mt-4 text-[var(--color-ink)]">{t(locale, "uploadTitle")}</p>
      <p className="text-sm text-[var(--color-muted)]">{t(locale, "uploadSubtitle")}</p>

      {closed ? (
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white/60 p-6 text-center">
          <p className="font-medium">
            {!info.isActive ? t(locale, "eventClosed") : t(locale, "limitReached")}
          </p>
        </div>
      ) : allDone && queue.every((q) => q.status === "done") ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-white/70 p-8 text-center border border-[var(--color-border)]">
          <CheckCircle2 className="h-12 w-12 text-[var(--color-forest)]" />
          <p className="font-display text-xl">{t(locale, "thanks")}</p>
          <p className="text-sm text-[var(--color-muted)]">{t(locale, "thanksSub")}</p>
          <Button type="button" variant="outline" onClick={() => { setQueue([]); setAllDone(false); }}>
            {t(locale, "uploadMore")}
          </Button>
        </div>
      ) : (
        <>
          <label className="mt-6 block text-sm text-[var(--color-muted)]">
            {t(locale, "yourName")}
            <input
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-4 py-3 text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-gold)]/40"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={80}
            />
          </label>

          <label
            className={cn(
              "mt-6 flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-gold)]/50 bg-white/50 p-6 transition hover:border-[var(--color-gold)] hover:bg-white/80",
            )}
          >
            <Camera className="h-8 w-8 text-[var(--color-gold)]" />
            <span className="text-center text-sm text-[var(--color-muted)]">
              {t(locale, "dropHere")}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
          </label>

          {queue.length > 0 && (
            <ul className="mt-6 space-y-3">
              {queue.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[var(--color-border)] bg-white/60 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.file.name}</span>
                    {item.status === "uploading" && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    )}
                    {item.status === "error" && (
                      <span className="text-red-600 text-xs">{t(locale, "retry")}</span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-blush)]">
                    <div
                      className="h-full bg-[var(--color-gold)] transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
        </>
      )}

      <p className="mt-8 flex items-center justify-center gap-1 text-xs text-[var(--color-muted)]">
        <Upload className="h-3 w-3" />
        {t(locale, "weakWifi")}
      </p>
    </div>
  );
}
