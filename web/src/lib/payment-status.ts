export type MobilePaymentStatus = "pending" | "paid" | "failed";

export function mapMobilePaymentStatus(
  paymentStatus: string,
  eventIsPaid: boolean,
): MobilePaymentStatus {
  if (eventIsPaid || paymentStatus === "paid") return "paid";
  if (paymentStatus === "failed" || paymentStatus === "cancelled") return "failed";
  return "pending";
}
