import Link from "next/link";
import { ColorfulShell } from "@/components/colorful-shell";

export const metadata = {
  title: "ოფლაინი — Momenti",
};

export default function OfflinePage() {
  return (
    <ColorfulShell className="flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl">📡</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-gradient">
        ოფლაინი ხარ
      </h1>
      <p className="mt-3 max-w-sm text-[var(--text-muted)]">
        ინტერნეტი არ არის, მაგრამ Momenti აპი მუშაობს. სტუმრის ატვირთვები რიგში
        დგას და გაიგზავნება კავშირის აღდგომისას.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full btn-gradient px-8 py-3 font-bold text-white"
      >
        სცადე ხელახლა
      </Link>
      <p className="mt-6 text-xs text-[var(--text-muted)]" data-testid="offline-ready">
        Momenti PWA · offline fallback
      </p>
    </ColorfulShell>
  );
}
