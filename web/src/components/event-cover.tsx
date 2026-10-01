"use client";

import { useState } from "react";
import Image from "next/image";

function coupleInitials(names: string): string {
  const parts = names.split(/[&\s]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function EventCover({
  coverUrl,
  coupleNames,
  demoFallbackSrc = "/seed-samples/wedding-4.jpg",
}: {
  coverUrl: string | null;
  coupleNames: string;
  demoFallbackSrc?: string;
}) {
  const [useFallback, setUseFallback] = useState(!coverUrl);

  return (
    <div className="relative h-44 w-full overflow-hidden bg-[var(--surface-warm)]" data-testid="guest-cover">
      {!useFallback && coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover"
          data-testid="guest-cover-img"
          onError={() => setUseFallback(true)}
        />
      ) : (
        <>
          <Image
            src={demoFallbackSrc}
            alt=""
            fill
            className="object-cover"
            sizes="400px"
            priority
            data-testid="guest-cover-img"
          />
          {!coverUrl && (
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--accent)]/30 to-transparent"
              aria-hidden
            />
          )}
        </>
      )}
      {useFallback && !coverUrl && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--gradient-signature)]/80 font-display text-4xl font-bold text-white mix-blend-multiply"
          aria-hidden
        >
          {coupleInitials(coupleNames)}
        </div>
      )}
    </div>
  );
}
