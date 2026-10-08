/** Shared API contract shapes (documentation). Source of truth for behavior: web handlers + docs/MOBILE-API.md */

export type MobileAuthProvider = "google" | "apple" | "facebook";

export interface MobileOAuthStartResponse {
  authorizationUrl: string;
  state: string;
}

export interface MobileSessionResponse {
  token: string;
  user: { id: string; email: string | null; name: string | null };
}

export interface PasswordLoginRequest {
  email: string;
  password: string;
}

export interface PasswordSignupRequest extends PasswordLoginRequest {
  name?: string;
}
