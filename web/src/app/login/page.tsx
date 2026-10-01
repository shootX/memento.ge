"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";

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
    <ColorfulShell className="flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="card-chunky w-full max-w-md p-8"
      >
        <Link href="/" className="text-sm font-bold text-[var(--pink)]">← Momenti</Link>
        <h1 className="mt-4 text-3xl font-extrabold">შესვლა ✨</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">მაგიკ ლინკი ელფოსტაზე</p>
        <input
          type="email"
          required
          className="mt-6 w-full rounded-2xl border-2 border-pink-100 px-4 py-3 outline-none focus:border-[var(--pink)]"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="btn-gradient w-full mt-4 border-0">
          {loading ? "…" : "ლინკის გაგზავნა 📬"}
        </Button>
        <a
          href="/api/auth/google"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--text-ink)] py-3 text-sm font-bold"
        >
          Google-ით შესვლა
        </a>
        {devLink && (
          <p className="mt-4 text-xs break-all text-[var(--violet)]">
            Dev: <a href={devLink}>{devLink}</a>
          </p>
        )}
      </form>
    </ColorfulShell>
  );
}
