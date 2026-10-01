"use client";

import { SerwistProvider } from "@serwist/next/react";
import { PwaInstallUi } from "@/components/pwa/pwa-install-ui";
import { OfflineQueueBanner } from "@/components/pwa/offline-queue-banner";
import { useUploadQueueSync } from "@/components/pwa/use-upload-queue-sync";

const swDisabled =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_PWA_DEV !== "1";

function PwaEffects() {
  useUploadQueueSync();
  return null;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={swDisabled} register reloadOnOnline>
      <PwaEffects />
      {children}
      <PwaInstallUi />
      <OfflineQueueBanner />
    </SerwistProvider>
  );
}
