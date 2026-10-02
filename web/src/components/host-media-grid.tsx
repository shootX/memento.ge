"use client";

import { useState } from "react";
import { Download, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type HostGridMedia = {
  id: string;
  url: string;
  thumbUrl: string | null;
  mimeType: string;
  guestName: string | null;
  status: string;
  highlight?: boolean;
};

export function HostMediaGrid({
  media,
  onOpen,
  onDelete,
  onToggleHighlight,
}: {
  media: HostGridMedia[];
  onOpen: (item: HostGridMedia) => void;
  onDelete: (id: string) => void;
  onToggleHighlight: (id: string, next: boolean) => void;
}) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  if (media.length === 0) {
    return (
      <div className="card-chunky flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gradient-soft)] text-3xl">
          📷
        </div>
        <p className="text-xl font-bold">ჯერ ფოტო არ არის</p>
        <p className="max-w-sm text-[var(--muted)]">
          QR ბარათი დაუდე მაგიდაზე — სტუმრები აქ გამოჩნდებიან მაშინვე, როცა ატვირთავენ.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {media.map((m) => {
        const src = m.thumbUrl ?? m.url;
        const isLoaded = loaded[m.id];
        return (
          <div
            key={m.id}
            className="group relative mb-4 w-full break-inside-avoid overflow-hidden rounded-2xl border-2 border-[var(--border-soft)] bg-[var(--surface-warm)] shadow-md"
          >
            <div className="relative aspect-[3/4] w-full">
              {!isLoaded && (
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--bg-muted)] to-[var(--surface)] motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => onOpen(m)}
                className="relative block h-full w-full text-left"
              >
                {m.mimeType.startsWith("video/") ? (
                  <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img
                    src={src}
                    alt=""
                    data-testid="host-media-img"
                    className={cn(
                      "h-full w-full object-cover transition-opacity duration-300",
                      isLoaded ? "opacity-100" : "opacity-0",
                    )}
                    onLoad={() => setLoaded((s) => ({ ...s, [m.id]: true }))}
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.src !== m.url && m.url) {
                        el.src = m.url;
                        return;
                      }
                      setLoaded((s) => ({ ...s, [m.id]: true }));
                    }}
                  />
                )}
                {m.guestName && (
                  <p className="absolute bottom-0 w-full bg-gradient-to-t from-black/75 to-transparent p-2 text-xs font-semibold text-white">
                    {m.guestName}
                  </p>
                )}
                {m.status === "pending" && (
                  <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold">
                    მოდერაცია
                  </span>
                )}
                {m.highlight && (
                  <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-bold text-white">
                    რჩეული
                  </span>
                )}
              </button>
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <a
                href={m.url}
                download
                className="rounded-full bg-white/95 p-2 shadow"
                aria-label="ჩამოტვირთვა"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4 text-[var(--fg)]" />
              </a>
              <button
                type="button"
                className="rounded-full bg-white/95 p-2 shadow"
                aria-label="რჩეული"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHighlight(m.id, !m.highlight);
                }}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    m.highlight ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--fg)]",
                  )}
                />
              </button>
              <button
                type="button"
                className="rounded-full bg-white/95 p-2 shadow"
                aria-label="წაშლა"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(m.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
