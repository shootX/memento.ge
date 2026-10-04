"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";
import { oauthErrorMessageKa } from "@/lib/oauth/messages";

type Mode = "login" | "signup";

export function AuthEmailForm({
  mode,
  oauthProviders,
}: {
  mode: Mode;
  oauthProviders?: { google: boolean; facebook: boolean; apple: boolean };
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState<AuthLocale>("ka");

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setOauthError(oauthErrorMessageKa(err));
  }, []);

  const title = mode === "login" ? authT(locale, "loginTitle") : authT(locale, "signupTitle");
  const swapHref = mode === "login" ? "/signup" : "/login";
  const swapPrompt = mode === "login" ? authT(locale, "signupPrompt") : authT(locale, "loginPrompt");
  const swapLabel = mode === "login" ? authT(locale, "signupLink") : authT(locale, "loginLink");

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
    setWarning(data.warning ?? null);
    setSent(true);
    setLoading(false);
  };

  return (
    <ColorfulShell className="flex items-center justify-center px-4 py-8">
      <form onSubmit={submit} className="card-chunky w-full max-w-md p-8">
        <Link href="/" className="text-sm font-bold text-[var(--fg)]">
          {authT(locale, "backHome")}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{authT(locale, "magicSubtitle")}</p>
        {oauthError && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            {oauthError}
          </p>
        )}
        {sent ? (
          <div className="mt-6 space-y-4" data-testid="magic-link-sent">
            <p className="text-lg font-bold">{authT(locale, "checkEmail")}</p>
            <p className="text-sm text-[var(--muted)]">
              <strong>{email}</strong>
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={() => void submit()}>
              {authT(locale, "resent")}
            </Button>
            {warning && (
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{warning}</p>
            )}
          </div>
        ) : (
          <>
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-6 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
              placeholder={authT(locale, "emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={loading} className="btn-gradient mt-4 w-full border-0">
              {loading ? "…" : authT(locale, "sendLink")}
            </Button>
          </>
        )}
        <SocialLoginButtons className="mt-6" initialProviders={oauthProviders} />
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {swapPrompt}{" "}
          <Link
            href={swapHref}
            className="font-bold text-[var(--text-ink)] underline decoration-2 decoration-[var(--accent)] underline-offset-4 hover:decoration-[var(--accent)]"
          >
            {swapLabel}
          </Link>
        </p>
      </form>
    </ColorfulShell>
  );
}
