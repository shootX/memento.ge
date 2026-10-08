/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  NetworkOnly,
  NetworkFirst,
  ExpirationPlugin,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url }) =>
        request.method !== "GET" || url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/media/") &&
        url.searchParams.get("variant") === "thumb",
      handler: new NetworkFirst({
        cacheName: "memento-thumbs",
        networkTimeoutSeconds: 8,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 5 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("sync", (event: Event) => {
  const sync = event as Event & { tag?: string; waitUntil: (p: Promise<void>) => void };
  if (sync.tag === "memento-upload-sync") {
    sync.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
        (clients: readonly Client[]) => {
          for (const client of clients) {
            client.postMessage({ type: "FLUSH_UPLOAD_QUEUE" });
          }
        },
      ),
    );
  }
});
