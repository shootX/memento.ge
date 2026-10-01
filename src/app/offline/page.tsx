import Link from "next/link";
import { ColorfulShell } from "@/components/colorful-shell";

export const metadata = {
  title: "ოფლაინი — Momenti",
};

export default function OfflinePage() {
  return (
    <ColorfulShell className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <p className="shrink-0 text-6xl leading-none">📡</p>
        <h1 className="max-w-full break-words font-display text-3xl font-bold text-gradient sm:text-4xl">
          ოფლაინი ხარ
        </h1>
        <p className="w-full break-words text-pretty leading-relaxed text-[var(--text-muted)]">
          ინტერნეტი არ არის, მაგრამ Momenti აპი მუშაობს. სტუმრის ატვირთვები რიგში
          დგას და გაიგზავნება კავშირის აღდგომისას.
        </p>
        <Link
          href="/"
          className="shrink-0 rounded-full btn-gradient px-8 py-3 font-bold text-white"
        >
          სცადე ხელახლა
        </Link>
      </div>
      <p className="mt-8 text-xs text-[var(--text-muted)]" data-testid="offline-ready">
        Momenti PWA · offline fallback
      </p>
    </ColorfulShell>
  );
}
