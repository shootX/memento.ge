"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorfulShell } from "@/components/colorful-shell";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { useAuthCsrf } from "@/components/use-auth-csrf";
import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";
import { oauthErrorMessageKa } from "@/lib/oauth/messages";

type OAuthFlags = {
  google: boolean;
  facebook: boolean;
  apple: boolean;
};

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className="w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 pr-12 outline-none focus:border-[var(--accent)]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function MagicLinkSection({ locale, email }: { locale: AuthLocale; email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  };
  if (sent) {
    return <p className="text-sm font-semibold">{authT(locale, "checkEmail")}</p>;
  }
  return (
    <Button type="button" variant="outline" className="w-full" disabled={loading || !email} onClick={() => void submit()}>
      {loading ? "…" : authT(locale, "sendLink")}
    </Button>
  );
}

export function AuthPasswordForm({
  mode,
  oauthProviders,
  magicLinkEnabled,
}: {
  mode: "login" | "signup";
  oauthProviders?: OAuthFlags;
  magicLinkEnabled: boolean;
}) {
  const csrf = useAuthCsrf();
  const [locale, setLocale] = useState<AuthLocale>("ka");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setError(oauthErrorMessageKa(err));
  }, []);

  const title = mode === "login" ? authT(locale, "loginTitle") : authT(locale, "signupTitle");
  const swapHref = mode === "login" ? "/signup" : "/login";
  const swapPrompt = mode === "login" ? authT(locale, "signupPrompt") : authT(locale, "loginPrompt");
  const swapLabel = mode === "login" ? authT(locale, "signupLink") : authT(locale, "loginLink");
  const pwdOk = password.length >= 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email, password, csrf }
        : { email, password, passwordConfirm, name: name || undefined, csrf };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? authT(locale, "loginFailed"));
      return;
    }
    if (data.message) {
      setInfo(data.message);
      return;
    }
    if (data.redirect) {
      window.location.href = data.redirect;
    }
  };

  return (
    <ColorfulShell className="flex items-center justify-center px-4 py-8">
      <form onSubmit={submit} className="card-chunky w-full max-w-md p-8" data-testid={mode === "login" ? "login-form" : "signup-form"}>
        <Link href="/" className="text-sm font-bold text-[var(--fg)]">
          {authT(locale, "backHome")}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{authT(locale, "passwordSubtitle")}</p>
        {error && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="mt-4 rounded-xl bg-[var(--bg-muted)] p-3 text-sm" role="status">
            {info}
          </p>
        )}
        {mode === "signup" && (
          <input
            type="text"
            autoComplete="name"
            className="mt-6 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            placeholder={authT(locale, "namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          type="email"
          required
          autoComplete="email"
          className="mt-4 w-full rounded-2xl border-2 border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
          placeholder={authT(locale, "emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="mt-4 space-y-3">
          <PasswordInput
            id="password"
            label={authT(locale, "passwordLabel")}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={setPassword}
          />
          {mode === "signup" && (
            <>
              <PasswordInput
                id="passwordConfirm"
                label={authT(locale, "passwordConfirmLabel")}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
              />
              <ul className="text-xs text-[var(--text-muted)]" aria-live="polite">
                <li className={pwdOk ? "text-[var(--success)] font-semibold" : ""}>
                  {authT(locale, "passwordHintLength")}
                </li>
              </ul>
            </>
          )}
        </div>
        {mode === "login" && (
          <p className="mt-3 text-right text-sm">
            <Link href="/forgot-password" className="font-semibold text-[var(--text-ink)] underline decoration-[var(--accent)] underline-offset-4">
              {authT(locale, "forgotPassword")}
            </Link>
          </p>
        )}
        <Button type="submit" disabled={loading || !csrf} className="btn-gradient mt-4 w-full border-0">
          {loading ? "…" : mode === "login" ? authT(locale, "loginSubmit") : authT(locale, "signupSubmit")}
        </Button>
        {mode === "login" && magicLinkEnabled && (
          <div className="mt-6 border-t border-[var(--border-soft)] pt-6">
            <p className="text-center text-xs font-semibold text-[var(--text-muted)]">{authT(locale, "magicSubtitle")}</p>
            <div className="mt-3">
              <MagicLinkSection locale={locale} email={email} />
            </div>
          </div>
        )}
        <SocialLoginButtons className="mt-6" initialProviders={oauthProviders} />
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {swapPrompt}{" "}
          <Link
            href={swapHref}
            className="font-bold text-[var(--text-ink)] underline decoration-2 decoration-[var(--accent)] underline-offset-4"
          >
            {swapLabel}
          </Link>
        </p>
      </form>
    </ColorfulShell>
  );
}
