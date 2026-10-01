"use client";

import { useEffect, useState } from "react";

export function LandingLiveTicker({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-6 inline-flex items-center gap-3 rounded-full border-2 border-[var(--accent)]/25 bg-white/90 px-4 py-2 shadow-md">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
      </span>
      <span className="text-sm font-bold tabular-nums">
        <span className="text-gradient">{count.toLocaleString("ka-GE")}+</span>
        <span className="ml-2 text-[var(--muted)]">ფოტო ატვირთულია დღეს (დემო)</span>
      </span>
    </div>
  );
}
