"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Heart, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

export type LightboxItem = {
  id: string;
  url: string;
  guestName?: string | null;
  highlight?: boolean;
};

export function PhotoLightbox({
  item,
  onClose,
  onDelete,
  onToggleHighlight,
}: {
  item: LightboxItem | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onToggleHighlight?: (id: string, next: boolean) => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          data-testid="photo-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={onClose}
            aria-label="დახურვა"
          >
            <X className="h-6 w-6" />
          </button>
          {(onDelete || onToggleHighlight) && (
            <div
              className="absolute left-4 top-4 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={item.url}
                download
                className="rounded-full bg-white/95 p-3 shadow"
                aria-label="ჩამოტვირთვა"
              >
                <Download className="h-5 w-5 text-[var(--fg)]" />
              </a>
              {onToggleHighlight && (
                <button
                  type="button"
                  className="rounded-full bg-white/95 p-3 shadow"
                  aria-label="რჩეული"
                  onClick={() => onToggleHighlight(item.id, !item.highlight)}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      item.highlight
                        ? "fill-[var(--accent)] text-[var(--accent)]"
                        : "text-[var(--fg)]",
                    )}
                  />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="rounded-full bg-white/95 p-3 shadow"
                  aria-label="წაშლა"
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                </button>
              )}
            </div>
          )}
          <motion.img
            src={item.url}
            alt=""
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          />
          {item.guestName && (
            <p className="absolute bottom-8 text-lg font-bold text-white">{item.guestName}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
