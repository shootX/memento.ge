/** Bank of Georgia Online Payments — https://api.bog.ge/docs/ */

import { appUrl } from "@/lib/site-config";
import { BOG_DOCUMENTATION_CALLBACK_PUBLIC_KEY } from "@/lib/billing/bog-callback-public-key";

export type BogEnv = "sandbox" | "production";

export function bogEnv(): BogEnv {
  const v = (process.env.BOG_ENV ?? "production").toLowerCase();
  return v === "sandbox" ? "sandbox" : "production";
}

export function bogTokenUrl(): string {
  if (process.env.BOG_TOKEN_URL?.trim()) return process.env.BOG_TOKEN_URL.trim();
  return "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";
}

export function bogApiBaseUrl(): string {
  if (process.env.BOG_API_BASE_URL?.trim()) {
    return process.env.BOG_API_BASE_URL.replace(/\/$/, "");
  }
  return "https://api.bog.ge/payments/v1";
}

/** HTTPS URL registered in BOG business portal for server callbacks. */
export function bogCallbackUrl(): string {
  const override = process.env.BOG_CALLBACK_URL?.trim();
  if (override) return override;
  return `${appUrl()}/api/payments/bog/callback`;
}

export function bogCallbackPublicKeyPem(): string {
  const fromEnv = process.env.BOG_CALLBACK_PUBLIC_KEY?.trim();
  if (fromEnv) {
    return fromEnv.includes("BEGIN PUBLIC KEY")
      ? fromEnv
      : `-----BEGIN PUBLIC KEY-----\n${fromEnv}\n-----END PUBLIC KEY-----`;
  }
  return BOG_DOCUMENTATION_CALLBACK_PUBLIC_KEY;
}

export function bogPaymentMethods(): string[] {
  const raw = process.env.BOG_PAYMENT_METHODS ?? "card,google_pay,apple_pay";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function bogConfigured(): boolean {
  if (process.env.PAYMENT_MOCK === "1") return true;
  return Boolean(
    process.env.BOG_CLIENT_ID?.trim() && process.env.BOG_CLIENT_SECRET?.trim(),
  );
}

/** Normalize callback body or receipt `order_status` to a status key string. */
export function normalizeBogOrderStatus(
  orderStatus: string | { key?: string } | undefined,
): string | undefined {
  if (!orderStatus) return undefined;
  if (typeof orderStatus === "string") return orderStatus.toLowerCase();
  const key = orderStatus.key?.trim();
  return key ? key.toLowerCase() : undefined;
}

/** Paid only when BOG reports `completed` (standard ecommerce flow). */
export function bogOrderIsPaid(orderStatus: string | { key?: string } | undefined): boolean {
  return normalizeBogOrderStatus(orderStatus) === "completed";
}

const BOG_PENDING_STATUSES = new Set([
  "created",
  "processing",
  "pending",
  "in_progress",
  "refund_requested",
  "auth_requested",
  "blocked",
  "partial_completed",
]);

const BOG_FAILED_STATUSES = new Set(["rejected", "refunded", "refunded_partially"]);

export function mapBogOrderStatus(
  orderStatus: string | { key?: string } | undefined,
): "paid" | "pending" | "failed" {
  if (bogOrderIsPaid(orderStatus)) return "paid";
  const s = normalizeBogOrderStatus(orderStatus);
  if (!s) return "pending";
  if (BOG_PENDING_STATUSES.has(s)) return "pending";
  if (BOG_FAILED_STATUSES.has(s)) return "failed";
  return "failed";
}

export function bogOrderIsTerminalFailure(
  orderStatus: string | { key?: string } | undefined,
): boolean {
  const s = normalizeBogOrderStatus(orderStatus);
  return s ? BOG_FAILED_STATUSES.has(s) : false;
}
