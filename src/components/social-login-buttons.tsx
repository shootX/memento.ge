"use client";

import { authT, readAuthLocaleFromCookie, type AuthLocale } from "@/lib/auth-i18n";
import { useEffect, useState } from "react";

type ProviderFlags = {
  google: boolean;
  facebook: boolean;
  apple: boolean;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.95-2.34 5.45-4.98 7.13l7.73 6c4.51-4.16 7.11-10.27 7.11-17.63z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" aria-hidden="true">
      <path
        fill="currentColor"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-163.7-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.2 0 129.9 2.6 197.3 99.2zm-234-181.3c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.2 32.4-54.4 83.7-54.4 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.8-71.3z"
      />
    </svg>
  );
}

export function SocialLoginButtons({
  className,
  initialProviders,
}: {
  className?: string;
  initialProviders?: ProviderFlags;
}) {
  const [locale, setLocale] = useState<AuthLocale>("ka");
  const [providers, setProviders] = useState<ProviderFlags>(
    initialProviders ?? { google: false, facebook: false, apple: false },
  );

  useEffect(() => {
    setLocale(readAuthLocaleFromCookie());
    if (initialProviders) return;
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) =>
        setProviders({
          google: Boolean(d.google),
          facebook: Boolean(d.facebook),
          apple: Boolean(d.apple),
        }),
      )
      .catch(() => undefined);
  }, [initialProviders]);

  const any = providers.google || providers.facebook || providers.apple;
  if (!any) return null;

  return (
    <div className={className} data-testid="social-login-buttons">
      <p className="text-center text-xs font-semibold text-[var(--text-muted)]">
        {authT(locale, "orContinue")}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {providers.google && (
          <a
            href="/api/auth/google"
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border-2 border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--fg)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            data-testid="oauth-google"
          >
            <GoogleIcon />
            {authT(locale, "google")}
          </a>
        )}
        {providers.facebook && (
          <a
            href="/api/auth/facebook"
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-testid="oauth-facebook"
          >
            <FacebookIcon />
            {authT(locale, "facebook")}
          </a>
        )}
        {providers.apple && (
          <a
            href="/api/auth/apple"
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full bg-black px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-testid="oauth-apple"
          >
            <AppleIcon />
            {authT(locale, "apple")}
          </a>
        )}
      </div>
    </div>
  );
}
