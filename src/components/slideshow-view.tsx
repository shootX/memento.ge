"use client";

import { useEffect, useState } from "react";

type Slide = {
  id: string;
  url: string;
  mimeType: string;
  guestName: string | null;
};

export function SlideshowView({ token }: { token: string }) {
  const [current, setCurrent] = useState<Slide | null>(null);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const es = new EventSource(`/api/host/${token}/slideshow/stream`);
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as Slide;
      setFade(false);
      setTimeout(() => {
        setCurrent(data);
        setFade(true);
      }, 200);
    };
    return () => es.close();
  }, [token]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {!current ? (
        <p className="font-display text-2xl text-white/60 animate-pulse">
          ველოდებით ფოტოებს…
        </p>
      ) : (
        <div
          className={`transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {current.mimeType.startsWith("video/") ? (
            <video
              key={current.id}
              src={current.url}
              className="max-h-screen max-w-screen object-contain"
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              key={current.id}
              src={current.url}
              alt=""
              className="max-h-screen max-w-screen object-contain"
            />
          )}
          {current.guestName && (
            <p className="absolute bottom-8 left-0 right-0 text-center text-white/80 text-lg">
              {current.guestName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
