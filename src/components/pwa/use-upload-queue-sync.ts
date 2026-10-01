"use client";

import { useEffect } from "react";
import { flushUploadQueue } from "@/lib/offline-upload-queue";

export function useUploadQueueSync() {
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data?.type === "FLUSH_UPLOAD_QUEUE") {
        void flushUploadQueue().then(() => {
          window.dispatchEvent(new CustomEvent("momenti-queue-flush"));
        });
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    const onOnline = () => {
      void flushUploadQueue().then(() => {
        window.dispatchEvent(new CustomEvent("momenti-queue-flush"));
      });
    };
    window.addEventListener("online", onOnline);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      window.removeEventListener("online", onOnline);
    };
  }, []);
}
