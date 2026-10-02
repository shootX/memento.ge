/** Bank of Georgia Online Payments — https://api.bog.ge/docs/ */

export type BogEnv = "sandbox" | "production";

export function bogEnv(): BogEnv {
  const v = (process.env.BOG_ENV ?? "production").toLowerCase();
  return v === "sandbox" ? "sandbox" : "production";
}

export function bogTokenUrl(): string {
  if (process.env.BOG_TOKEN_URL?.trim()) return process.env.BOG_TOKEN_URL;
  if (bogEnv() === "sandbox") {
    return "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";
  }
  return "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";
}

export function bogApiBaseUrl(): string {
  if (process.env.BOG_API_BASE_URL?.trim()) {
    return process.env.BOG_API_BASE_URL.replace(/\/$/, "");
  }
  return "https://api.bog.ge/payments/v1";
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

/** BOG `order_status` values treated as paid (see api.bog.ge order details). */
export const BOG_PAID_ORDER_STATUSES = new Set([
  "completed",
  "success",
  "paid",
  "approved",
  "succeeded",
]);

export function bogOrderIsPaid(orderStatus: string | undefined): boolean {
  if (!orderStatus) return false;
  return BOG_PAID_ORDER_STATUSES.has(orderStatus.toLowerCase());
}

export function mapBogOrderStatus(
  orderStatus: string | undefined,
): "paid" | "pending" | "failed" {
  if (bogOrderIsPaid(orderStatus)) return "paid";
  if (!orderStatus) return "pending";
  const s = orderStatus.toLowerCase();
  if (s === "created" || s === "processing" || s === "pending" || s === "in_progress") {
    return "pending";
  }
  return "failed";
}
