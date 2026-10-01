"use client";

import { useEffect, useState } from "react";
import { listQueuedUploads } from "@/lib/offline-upload-queue";
import { pwaT, type PwaLocale } from "@/lib/pwa-i18n";

export function OfflineQueueBanner() {
  const [count, setCount] = useState(0);
  const locale: PwaLocale = "ka";

  const refresh = () => {
    void listQueuedUploads().then((q) => setCount(q.length));
  };

  useEffect(() => {
    refresh();
    window.addEventListener("memento-queue-flush", refresh);
    const id = setInterval(refresh, 4000);
    return () => {
      window.removeEventListener("memento-queue-flush", refresh);
      clearInterval(id);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div
      className="fixed top-2 left-2 right-2 z-[85] mx-auto max-w-md rounded-full bg-[var(--bg-dark)] px-4 py-2 text-center text-sm font-bold text-white shadow-lg"
      data-testid="offline-queue-banner"
    >
      {pwaT(locale, "queueBanner")} ({count})
    </div>
  );
}
