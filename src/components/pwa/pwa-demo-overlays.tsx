import { headers } from "next/headers";
import { pwaT } from "@/lib/pwa-i18n";

export async function PwaDemoOverlays() {
  const h = await headers();
  const mode = h.get("x-memento-pwa-demo");
  if (!mode) return null;

  const locale = "ka" as const;

  if (mode === "install") {
    return (
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
          <img src="/icons/icon-96.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="btn-gradient rounded-full px-5 py-2 text-sm font-bold text-white">
            {pwaT(locale, "installCta")}
          </span>
          <span className="text-sm font-semibold text-[var(--text-muted)]">
            {pwaT(locale, "dismiss")}
          </span>
        </div>
      </div>
    );
  }

  if (mode === "ios") {
    return (
      <div
        className="fixed inset-0 z-[95] flex items-end justify-center bg-black/40 p-4"
        data-testid="pwa-ios-sheet"
      >
        <div className="card-chunky w-full max-w-md p-6 animate-fade-up">
          <p className="break-words text-2xl font-extrabold">{pwaT(locale, "iosTitle")} 📲</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            <li className="break-words text-pretty">{pwaT(locale, "iosStep1")}</li>
            <li className="break-words text-pretty">{pwaT(locale, "iosStep2")}</li>
            <li className="break-words text-pretty">{pwaT(locale, "iosStep3")}</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <span className="btn-gradient flex-1 rounded-full py-2 text-center font-bold text-white">
              {pwaT(locale, "installCta")}
            </span>
            <span className="rounded-full px-4 py-2 font-semibold">{pwaT(locale, "dismiss")}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
