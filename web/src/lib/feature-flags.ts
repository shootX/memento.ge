export function partnerFinanceEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.PARTNER_FINANCE_ENABLED === "1";
  }
  return process.env.PARTNER_FINANCE_ENABLED !== "0";
}
