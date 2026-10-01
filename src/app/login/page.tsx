"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setDevLink(data.devLink ?? null);
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-[var(--color-cream)] to-white">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white/80 p-8 shadow-sm"
      >
        <Link href="/" className="text-sm text-[var(--color-muted)]">← Momenti</Link>
        <h1 className="font-display text-2xl mt-4">შესვლა</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">მაგიკ ლინკი ელფოსტაზე</p>
        <input
          type="email"
          required
          className="mt-6 w-full rounded-xl border px-4 py-3"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="w-full mt-4">
          {loading ? "…" : "ლინკის გაგზავნა"}
        </Button>
        {devLink && (
          <p className="mt-4 text-xs break-all text-[var(--color-forest)]">
            Dev: <a href={devLink}>{devLink}</a>
          </p>
        )}
      </form>
    </main>
  );
}
