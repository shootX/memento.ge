import { ColorfulShell } from "@/components/colorful-shell";
import { PushSettings } from "@/components/pwa/push-settings";
import { readFile } from "fs/promises";
import path from "path";
import { signCsrfToken } from "@/lib/crypto";

export default async function PwaPreviewPage() {
  let hostToken = "demo-host-token-momenti-2026";
  try {
    const manifest = JSON.parse(
      await readFile(path.join(process.cwd(), "public/demo-manifest.json"), "utf8"),
    );
    hostToken = manifest.hostToken;
  } catch {
    /* fallback */
  }
  const csrfToken = signCsrfToken(hostToken);

  return (
    <ColorfulShell className="px-4 py-12">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="card-chunky p-8 text-center" data-testid="home-screen-mock">
          <p className="text-xs font-bold text-[var(--text-muted)]">iPhone Home Screen</p>
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-1">
              <img
                src="/icons/icon-192.png"
                alt="Momenti"
                className="h-16 w-16 rounded-2xl shadow-lg"
              />
              <span className="text-[10px] font-semibold">Momenti</span>
            </div>
            {["ფოტო", "კამერა", "ჩატი", "მუსიკა"].map((label) => (
              <div key={label} className="flex flex-col items-center gap-1 opacity-40">
                <div className="h-16 w-16 rounded-2xl bg-gray-200" />
                <span className="text-[10px]">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-chunky p-6">
          <PushSettings hostToken={hostToken} csrfToken={csrfToken} demo />
        </div>
      </div>
    </ColorfulShell>
  );
}
