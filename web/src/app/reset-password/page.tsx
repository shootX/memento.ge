"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";
import { useAuthCsrf } from "@/components/use-auth-csrf";
import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";

function ResetForm() {
  const csrf = useAuthCsrf();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [locale, setLocale] = useState<AuthLocale>("ka");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, passwordConfirm, csrf }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    window.location.href = data.redirect ?? "/dashboard";
  };

  return (
    <form onSubmit={submit} className="card-chunky w-full max-w-md p-8">
      <Link href="/login" className="text-sm font-bold text-[var(--fg)]">
        {authT(locale, "backHome")}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">{authT(locale, "resetTitle")}</h1>
      <input
        type="password"
        required
        minLength={8}
        className="mt-6 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
        placeholder={authT(locale, "passwordLabel")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        required
        minLength={8}
        className="mt-3 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
        placeholder={authT(locale, "passwordConfirmLabel")}
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={!csrf || !token} className="btn-gradient mt-4 w-full border-0">
        {authT(locale, "resetSubmit")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <ColorfulShell className="flex items-center justify-center px-4 py-8">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </ColorfulShell>
  );
}
