export type PlanTier = "starter" | "classic" | "premium";

export interface PlanConfig {
  id: PlanTier;
  nameKa: string;
  nameEn: string;
  priceGel: number;
  maxUploads: number;
  maxBytesPerFile: number;
  maxTotalBytes: number;
  retentionDays: number;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  starter: {
    id: "starter",
    nameKa: "სტარტერი",
    nameEn: "Starter",
    priceGel: 49,
    maxUploads: 200,
    maxBytesPerFile: 15 * 1024 * 1024,
    maxTotalBytes: 2 * 1024 * 1024 * 1024,
    retentionDays: 30,
  },
  classic: {
    id: "classic",
    nameKa: "კლასიკი",
    nameEn: "Classic",
    priceGel: 99,
    maxUploads: 600,
    maxBytesPerFile: 25 * 1024 * 1024,
    maxTotalBytes: 8 * 1024 * 1024 * 1024,
    retentionDays: 90,
  },
  premium: {
    id: "premium",
    nameKa: "პრემიუმ",
    nameEn: "Premium",
    priceGel: 149,
    maxUploads: 1500,
    maxBytesPerFile: 50 * 1024 * 1024,
    maxTotalBytes: 25 * 1024 * 1024 * 1024,
    retentionDays: 365,
  },
};

export function getPlan(tier: string): PlanConfig {
  return PLANS[tier as PlanTier] ?? PLANS.starter;
}

export function computeExpiresAt(plan: PlanConfig, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + plan.retentionDays);
  return d;
}
