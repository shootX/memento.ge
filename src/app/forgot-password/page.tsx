"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";
import { useAuthCsrf } from "@/components/use-auth-csrf";
import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";

export default function ForgotPasswordPage() {
  const csrf = useAuthCsrf();
  const [locale, setLocale] = useState<AuthLocale>("ka");
  const [email, setEmail] = useState("");
  const [emailOk, setEmailOk] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => setEmailOk(Boolean(d.email)))
      .catch(() => setEmailOk(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, csrf }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setSent(true);
  };

  return (
    <ColorfulShell className="flex items-center justify-center px-4 py-8">
      <form onSubmit={submit} className="card-chunky w-full max-w-md p-8">
        <Link href="/login" className="text-sm font-bold text-[var(--fg)]">
          {authT(locale, "backHome")}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">{authT(locale, "forgotTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{authT(locale, "forgotSubtitle")}</p>
        {!emailOk && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{authT(locale, "forgotNoEmail")}</p>
        )}
        {sent ? (
          <p className="mt-6 font-bold">{authT(locale, "checkEmail")}</p>
        ) : (
          <>
            <input
              type="email"
              required
              disabled={!emailOk}
              className="mt-6 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
              placeholder={authT(locale, "emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={!csrf || !emailOk} className="btn-gradient mt-4 w-full border-0">
              {authT(locale, "sendLink")}
            </Button>
          </>
        )}
      </form>
    </ColorfulShell>
  );
}
