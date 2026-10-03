"use client";

import { formatEventDate } from "@/lib/format-date";

import { useCallback, useEffect, useRef, useState } from "react";
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
  coverUrl: string | null;
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
  const [newPulse, setNewPulse] = useState(false);
  const seenRef = useRef(new Set<string>());

  const current = slides[index] ?? null;
  const waiting = !current;

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
      setIndex((i) => (i + 1) % slides.length);
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
      setIndex(slides.length);
    };
    return () => es.close();
  }, [slideshowToken, slides.length]);

  const enterFullscreen = () => {
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") enterFullscreen();
      if (waiting || slides.length < 2) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % slides.length);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waiting, slides.length]);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[var(--bg-dark)] text-white"
      data-testid={slides.length > 0 ? "slideshow-ready" : "slideshow-waiting"}
      role="region"
      aria-label="Live slideshow"
    >
      <a href="#slideshow-main" className="skip-link">
        სლაიდშოუს შიგთავსი
      </a>
      {waiting && boot?.coverUrl && (
        <>
          <img
            src={boot.coverUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-3xl brightness-75"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/45 z-[5]" />
        </>
      )}

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
          aria-label="სრული ეკრანი (F)"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm font-bold backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          title="Fullscreen (F)"
        >
          <Maximize2 className="h-4 w-4" />
          სრული ეკრანი
        </button>
      </header>

      <div id="slideshow-main" className="absolute inset-0 flex items-center justify-center z-20">
        {waiting ? (
          <div className="flex max-w-lg flex-col items-center gap-8 px-6 text-center">
            <p className="font-display text-xl text-white/70 md:text-2xl">ველოდებით ფოტოებს…</p>
            <img
              src={`/api/slideshow/${slideshowToken}/qr`}
              alt="QR"
              width={480}
              height={480}
              className="h-[min(52vw,22rem)] w-[min(52vw,22rem)] rounded-2xl bg-white p-4 shadow-2xl ring-4 ring-white/20"
            />
            {boot?.guestUrl ? (
              <a
                href={boot.guestUrl}
                className="pointer-events-auto rounded-full btn-gradient px-10 py-4 text-lg font-extrabold shadow-xl transition hover:scale-[1.02] md:text-xl"
              >
                გაგვიზიარე ფოტო →
              </a>
            ) : null}
            <p className="text-sm text-white/60">ან დაასკანერე QR კოდი</p>
          </div>
        ) : current.mimeType.startsWith("video/") ? (
          <video
            key={current.id}
            src={current.url}
            data-testid="slideshow-slide-visible"
            className="max-h-full max-w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div
            className="relative h-full w-full"
            data-testid="slideshow-slide-visible"
          >
            <img
              key={current.id}
              src={current.url}
              alt=""
              data-testid="slideshow-slide-image"
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

      {!waiting && (
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
      )}
    </div>
  );
}
