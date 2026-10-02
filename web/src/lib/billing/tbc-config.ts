/** TBC TPay Checkout — https://developers.tbcbank.ge/ */

export type TbcEnv = "sandbox" | "production";

export function tbcEnv(): TbcEnv {
  const v = (process.env.TBC_ENV ?? "production").toLowerCase();
  return v === "sandbox" ? "sandbox" : "production";
}

export function tbcApiBaseUrl(): string {
  if (process.env.TBC_API_BASE_URL?.trim()) {
    return process.env.TBC_API_BASE_URL.replace(/\/$/, "");
  }
  return "https://api.tbcbank.ge";
}

/**
 * TBC payment method IDs (verify in TBC merchant portal / developers.tbcbank.ge):
 * 5 = card, 6 = Apple Pay, 7 = Google Pay (common sandbox mapping).
 */
export function tbcPaymentMethodIds(): number[] {
  const raw = process.env.TBC_PAYMENT_METHODS ?? "5,6,7";
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function tbcConfigured(): boolean {
  if (process.env.PAYMENT_MOCK === "1") return true;
  return Boolean(
    process.env.TBC_API_KEY?.trim() &&
      process.env.TBC_CLIENT_ID?.trim() &&
      process.env.TBC_CLIENT_SECRET?.trim(),
  );
}
