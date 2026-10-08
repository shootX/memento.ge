"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pwaT, type PwaLocale } from "@/lib/pwa-i18n";
import { LocaleToggle } from "@/components/locale-toggle";
import type { Locale } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallUi() {
  const pathname = usePathname() ?? "";
  const [locale, setLocale] = useState<PwaLocale>("ka");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoAndroid = params.get("pwa_install_demo") === "1";
    const demoIos = params.get("pwa_ios_demo") === "1";
    if (demoAndroid || demoIos) return;

    if (!pathname.startsWith("/e/")) return;

    const dismissed = localStorage.getItem("memento_pwa_install_dismiss");
    const uploaded = localStorage.getItem("memento_guest_has_uploaded");
    if (isStandalone() || dismissed || uploaded !== "1") return;

    if (isIos()) {
      setShowIos(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [pathname]);

  const dismiss = () => {
    localStorage.setItem("memento_pwa_install_dismiss", "1");
    setShowAndroid(false);
    setShowIos(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShowAndroid(false);
  };

  const loc = locale as Locale;

  return (
    <>
      {showAndroid && (
        <div
          className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-lg card-chunky border-2 border-[var(--pink)] p-4 shadow-2xl animate-fade-up md:left-auto md:right-6"
          data-testid="pwa-install-banner"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="break-words font-extrabold text-lg">{pwaT(locale, "installTitle")}</p>
              <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
                {pwaT(locale, "installBody")}
              </p>
            </div>
            <img src="/icons/icon-96.png" alt="" className="h-12 w-12 rounded-2xl" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-gradient rounded-full px-5 py-2 text-sm font-bold text-white"
              onClick={() => void install()}
            >
              {pwaT(locale, "installCta")}
            </button>
            <button type="button" className="text-sm font-semibold text-[var(--text-muted)]" onClick={dismiss}>
              {pwaT(locale, "dismiss")}
            </button>
            <LocaleToggle value={loc} onChange={(l) => setLocale(l as PwaLocale)} />
          </div>
        </div>
      )}

      {showIos && (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/40 p-4"
          data-testid="pwa-ios-sheet"
        >
          <div className="card-chunky w-full max-w-md p-6 animate-fade-up">
            <p className="text-2xl font-extrabold">{pwaT(locale, "iosTitle")} 📲</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
              <li className="break-words text-pretty">{pwaT(locale, "iosStep1")}</li>
              <li className="break-words text-pretty">{pwaT(locale, "iosStep2")}</li>
              <li className="break-words text-pretty">{pwaT(locale, "iosStep3")}</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-gradient flex-1 rounded-full py-2 font-bold text-white" onClick={dismiss}>
                {pwaT(locale, "installCta")}
              </button>
              <button type="button" className="rounded-full px-4 py-2 font-semibold" onClick={dismiss}>
                {pwaT(locale, "dismiss")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
