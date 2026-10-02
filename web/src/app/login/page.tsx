"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(Boolean(d.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setWarning(null);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setDevLink(data.devLink ?? null);
    setWarning(data.warning ?? null);
    setSent(true);
    setLoading(false);
  };

  return (
    <ColorfulShell className="flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="card-chunky w-full max-w-md p-8"
      >
        <Link href="/" className="text-sm font-bold text-[var(--fg)]">
          ← მემენტო
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">შესვლა</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">მაგიკ ლინკი ელფოსტაზე</p>
        {sent ? (
          <div className="mt-6 space-y-4" data-testid="magic-link-sent">
            <p className="font-bold text-lg">შეამოწმე ელფოსტა 📬</p>
            <p className="text-sm text-[var(--muted)]">
              გამოგიგზავნეთ შესვლის ბმული: <strong>{email}</strong>
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={() => void submit()}>
              ხელახლა გაგზავნა
            </Button>
            {warning && (
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{warning}</p>
            )}
            {devLink && (
              <p className="text-xs break-all text-[var(--muted)]">
                ადმინისთვის:{" "}
                <a href={devLink} className="font-semibold underline">
                  {devLink}
                </a>
              </p>
            )}
          </div>
        ) : (
          <>
            <input
              type="email"
              required
              className="mt-6 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={loading} className="btn-gradient w-full mt-4 border-0">
              {loading ? "…" : "ლინკის გაგზავნა"}
            </Button>
          </>
        )}
        {googleEnabled && (
          <a
            href="/api/auth/google"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--text-ink)] py-3 text-sm font-bold"
          >
            Google-ით შესვლა
          </a>
        )}
      </form>
    </ColorfulShell>
  );
}
