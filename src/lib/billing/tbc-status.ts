/** TBC TPay payment status → internal mapping */

export const TBC_PAID_STATUSES = new Set(["Succeeded", "succeeded", "SUCCESS"]);

export function tbcIsPaidStatus(status: string | undefined): boolean {
  if (!status) return false;
  return TBC_PAID_STATUSES.has(status) || status.toLowerCase() === "succeeded";
}

export function mapTbcPaymentStatus(
  status: string | undefined,
): "paid" | "pending" | "failed" {
  if (tbcIsPaidStatus(status)) return "paid";
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s === "created" || s === "pending" || s === "processing") return "pending";
  return "failed";
}
