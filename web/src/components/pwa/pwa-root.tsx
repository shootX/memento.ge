"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PwaProvider } from "@/components/pwa/pwa-provider";

const DeferredPwaProvider = dynamic(
  () => import("@/components/pwa/pwa-provider").then((m) => ({ default: m.PwaProvider })),
  { ssr: false },
);

const LIGHT_ROUTES = new Set(["/", "/pricing", "/faq", "/for-partners"]);

function useDeferredPwa(pathname: string): boolean {
  const light = LIGHT_ROUTES.has(pathname);
  const [ready, setReady] = useState(!light);

  useEffect(() => {
    if (!light) {
      setReady(true);
      return;
    }
    const boot = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(boot, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = globalThis.setTimeout(boot, 2500);
    return () => globalThis.clearTimeout(t);
  }, [light]);

  return ready;
}

export function PwaRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const light = LIGHT_ROUTES.has(pathname);
  const pwaReady = useDeferredPwa(pathname);

  if (light) {
    if (!pwaReady) {
      return <>{children}</>;
    }
    return <DeferredPwaProvider>{children}</DeferredPwaProvider>;
  }

  return <PwaProvider>{children}</PwaProvider>;
}
