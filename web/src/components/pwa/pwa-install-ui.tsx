"use client";

import { useEffect, useState } from "react";
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
  const [locale, setLocale] = useState<PwaLocale>("ka");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoAndroid = params.get("pwa_install_demo") === "1";
    const demoIos = params.get("pwa_ios_demo") === "1";
    const dismissed = localStorage.getItem("momenti_pwa_install_dismiss");

    if (demoAndroid) {
      setShowAndroid(true);
      return;
    }
    if (demoIos) {
      setShowIos(true);
      return;
    }

    if (isStandalone() || dismissed) return;

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
  }, []);

  const dismiss = () => {
    localStorage.setItem("momenti_pwa_install_dismiss", "1");
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
            <div>
              <p className="font-extrabold text-lg">{pwaT(locale, "installTitle")}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
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
              <li>{pwaT(locale, "iosStep1")}</li>
              <li>{pwaT(locale, "iosStep2")}</li>
              <li>{pwaT(locale, "iosStep3")}</li>
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
