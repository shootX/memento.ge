"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PwaProvider } from "@/components/pwa/pwa-provider";

const GuestPwaProvider = dynamic(
  () => import("@/components/pwa/pwa-provider").then((m) => ({ default: m.PwaProvider })),
  { ssr: false },
);

export function PwaRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const guest = pathname.startsWith("/e/");

  if (!guest) {
    return <>{children}</>;
  }

  return <GuestPwaProvider>{children}</GuestPwaProvider>;
}
