import { publicAppUrl } from "@/lib/app-url";

export type OAuthProviderId = "google" | "facebook" | "apple";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://qr.socialsave.cc",
  "https://memento.ge",
  "https://www.memento.ge",
];

const CALLBACK_PATH: Record<OAuthProviderId, string> = {
  google: "/api/auth/google/callback",
  facebook: "/api/auth/facebook/callback",
  apple: "/api/auth/apple/callback",
};

export function oauthAllowedOrigins(): string[] {
  const fromEnv = process.env.OAUTH_ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const base = publicAppUrl().replace(/\/$/, "");
  const set = new Set([...DEFAULT_ALLOWED_ORIGINS, ...(fromEnv ?? [])]);
  if (process.env.NODE_ENV !== "production") {
    set.add(base);
    set.add("http://127.0.0.1:43123");
    set.add("http://localhost:43123");
  }
  return [...set];
}

export function assertOAuthAppOrigin(): string {
  const base = publicAppUrl().replace(/\/$/, "");
  const allowed = oauthAllowedOrigins();
  if (!allowed.includes(base)) {
    throw new Error("NEXT_PUBLIC_APP_URL is not on the OAuth redirect allowlist");
  }
  return base;
}

export function oauthRedirectUri(provider: OAuthProviderId): string {
  return `${assertOAuthAppOrigin()}${CALLBACK_PATH[provider]}`;
}

export function safeReturnPath(value: string | null | undefined): string {
  if (!value) return "/dashboard";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/dashboard";
  }
  if (trimmed.includes("://")) return "/dashboard";
  return trimmed;
}

export function loginRedirectQuery(params: Record<string, string>): string {
  const q = new URLSearchParams(params);
  return `/login?${q.toString()}`;
}
