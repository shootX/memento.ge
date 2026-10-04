import type { OAuthProviderId } from "@/lib/oauth/redirect-uri";

export type MockOAuthProfile = {
  sub: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
};

const store = new Map<string, MockOAuthProfile>();

export function mockOAuthEnabled(): boolean {
  return process.env.OAUTH_MOCK === "1" || process.env.NODE_ENV === "test";
}

export function mockAuthorizeUrl(provider: OAuthProviderId, state: string, nonce: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:43123";
  const q = new URLSearchParams({ provider, state, nonce });
  return `${base}/api/auth/mock/authorize?${q}`;
}

export function registerMockOAuthCode(code: string, profile: MockOAuthProfile) {
  store.set(code, profile);
}

export function takeMockOAuthProfile(code: string): MockOAuthProfile | null {
  if (!code.startsWith("mock_")) return null;
  const profile = store.get(code) ?? null;
  store.delete(code);
  return profile;
}

export function peekMockOAuthProfile(code: string): MockOAuthProfile | null {
  return store.get(code) ?? null;
}
