"use client";

import { formatEventDate } from "@/lib/format-date";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Maximize2 } from "lucide-react";

type Slide = {
  id: string;
  url: string;
  mimeType: string;
  guestName: string | null;
};

type Bootstrap = {
  coupleNames: string;
  eventDate: string;
  guestUrl: string;
  items: Slide[];
};

export function SlideshowView({
  slideshowToken,
  initialBoot = null,
}: {
  slideshowToken: string;
  initialBoot?: Bootstrap | null;
}) {
  const [boot, setBoot] = useState<Bootstrap | null>(initialBoot);
  const [slides, setSlides] = useState<Slide[]>(initialBoot?.items ?? []);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [newPulse, setNewPulse] = useState(false);
  const seenRef = useRef(new Set<string>());

  const current = slides[index] ?? null;

  const loadBootstrap = useCallback(async () => {
    const res = await fetch(`/api/slideshow/${slideshowToken}`);
    if (!res.ok) return;
    const data = (await res.json()) as Bootstrap;
    setBoot(data);
    setSlides(data.items);
    data.items.forEach((i) => seenRef.current.add(i.id));
  }, [slideshowToken]);

  useEffect(() => {
    if (!initialBoot) void loadBootstrap();
    else {
      initialBoot.items.forEach((i) => seenRef.current.add(i.id));
    }
  }, [loadBootstrap, initialBoot]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setFade(true);
      }, 600);
    }, 9000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    const es = new EventSource(`/api/slideshow/${slideshowToken}/stream`);
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as Slide & { type?: string };
      if (seenRef.current.has(data.id)) return;
      seenRef.current.add(data.id);
      setSlides((s) => [...s, data]);
      setNewPulse(true);
      setTimeout(() => setNewPulse(false), 2500);
      setFade(false);
      setTimeout(() => {
        setIndex(slides.length);
        setFade(true);
      }, 300);
    };
    return () => es.close();
  }, [slideshowToken, slides.length]);

  const enterFullscreen = () => {
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") enterFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[var(--bg-dark)] text-white"
      data-testid={slides.length > 0 ? "slideshow-ready" : "slideshow-waiting"}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10" />

      <header className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-6 md:p-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Memento Live</p>
          <h1 className="font-display text-2xl md:text-4xl font-semibold mt-1">
            {boot?.coupleNames ?? "…"}
          </h1>
          {boot?.eventDate && (
            <p className="text-sm text-white/60 mt-1" suppressHydrationWarning>
              {formatEventDate(boot.eventDate, "ka")}
            </p>
          )}
        </div>
        {newPulse && (
          <span className="animate-fade-up rounded-full btn-gradient px-5 py-2 text-sm font-bold shadow-lg">
            ✨ ახალი ფოტო!
          </span>
        )}
        <button
          type="button"
          onClick={enterFullscreen}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm font-bold backdrop-blur-sm"
          title="Fullscreen (F)"
        >
          <Maximize2 className="h-4 w-4" />
          სრული ეკრანი
        </button>
      </header>

      <div className="absolute inset-0 flex items-center justify-center">
        {!current ? (
          <p className="font-display text-2xl text-white/50 animate-pulse z-20">
            ველოდებით ფოტოებს…
          </p>
        ) : current.mimeType.startsWith("video/") ? (
          <video
            key={current.id}
            src={current.url}
            className={cn(
              "max-h-full max-w-full object-contain transition-opacity duration-700",
              fade ? "opacity-100" : "opacity-0",
            )}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div
            className={cn(
              "relative h-full w-full transition-opacity duration-700",
              fade ? "opacity-100" : "opacity-0",
            )}
          >
            <img
              key={current.id}
              src={current.url}
              alt=""
              className="slideshow-ken-burns max-h-full max-w-full object-contain mx-auto"
            />
          </div>
        )}
      </div>

      {current?.guestName && (
        <p className="absolute bottom-28 left-0 right-0 z-20 text-center text-2xl font-bold text-white md:text-4xl drop-shadow-lg">
          {current.guestName}
        </p>
      )}

      <aside className="absolute bottom-6 right-6 z-20 flex items-end gap-4 rounded-2xl bg-black/50 backdrop-blur-md p-4 border border-white/20">
        <img
          src={`/api/slideshow/${slideshowToken}/qr`}
          alt="QR"
          width={360}
          height={360}
          className="h-[min(28vw,360px)] w-[min(28vw,360px)] rounded-lg bg-white p-3 shadow-lg"
        />
        <div className="max-w-[180px] text-sm text-white/90 leading-snug">
          დაასკანერე
          <br />
          და გაგვიზიარე ფოტო
        </div>
      </aside>
    </div>
  );
}
