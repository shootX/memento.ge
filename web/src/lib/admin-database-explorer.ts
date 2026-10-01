import { prisma } from "@/lib/prisma";

const REDACT = "[გაფარებული]";

const SENSITIVE_FIELDS = new Set([
  "passwordHash",
  "tokenHash",
  "galleryPasswordHash",
  "p256dh",
  "auth",
  "providerUserId",
]);

function sanitizeValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (SENSITIVE_FIELDS.has(key)) return REDACT;
  if (key === "endpoint" && typeof value === "string") {
    return value.length > 48 ? `${value.slice(0, 32)}…` : value;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "object") return sanitizeRow(value as Record<string, unknown>);
  return value;
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = sanitizeValue(k, v);
  }
  return out;
}

type TableSpec = {
  key: string;
  label: string;
  count: () => Promise<number>;
  latest: () => Promise<Record<string, unknown>[]>;
  hideRows?: boolean;
};

const specs: TableSpec[] = [
  {
    key: "User",
    label: "User",
    count: () => prisma.user.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
        }),
      ),
  },
  {
    key: "Session",
    label: "Session",
    count: () => prisma.session.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.session.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            userId: true,
            expiresAt: true,
            createdAt: true,
            tokenHash: true,
          },
        }),
      ),
  },
  {
    key: "MagicLinkToken",
    label: "MagicLinkToken",
    count: () => prisma.magicLinkToken.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.magicLinkToken.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, email: true, expiresAt: true, createdAt: true, tokenHash: true },
        }),
      ),
  },
  {
    key: "OAuthAccount",
    label: "OAuthAccount",
    count: () => prisma.oAuthAccount.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.oAuthAccount.findMany({
          orderBy: { id: "desc" },
          take: 5,
          select: { id: true, userId: true, provider: true, providerUserId: true },
        }),
      ),
  },
  {
    key: "PartnerOrg",
    label: "PartnerOrg",
    count: () => prisma.partnerOrg.count(),
    latest: async () =>
      sanitizeRows(await prisma.partnerOrg.findMany({ orderBy: { createdAt: "desc" }, take: 8 })),
  },
  {
    key: "PartnerMember",
    label: "PartnerMember",
    count: () => prisma.partnerMember.count(),
    latest: async () =>
      sanitizeRows(await prisma.partnerMember.findMany({ orderBy: { id: "desc" }, take: 8 })),
  },
  {
    key: "PartnerReferral",
    label: "PartnerReferral",
    count: () => prisma.partnerReferral.count(),
    latest: async () =>
      sanitizeRows(await prisma.partnerReferral.findMany({ orderBy: { createdAt: "desc" }, take: 8 })),
  },
  {
    key: "PartnerSubscription",
    label: "PartnerSubscription",
    count: () => prisma.partnerSubscription.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.partnerSubscription.findMany({ orderBy: { id: "desc" }, take: 5 }),
      ),
  },
  {
    key: "Event",
    label: "Event",
    count: () => prisma.event.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.event.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            coupleNames: true,
            guestSlug: true,
            planTier: true,
            isPaid: true,
            eventDate: true,
            expiresAt: true,
            uploadCount: true,
            partnerOrgId: true,
            disposableEnabled: true,
            publicGallery: true,
            galleryPasswordHash: true,
            createdAt: true,
          },
        }),
      ),
  },
  {
    key: "PushSubscription",
    label: "PushSubscription",
    count: () => prisma.pushSubscription.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.pushSubscription.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      ),
  },
  {
    key: "CoHostInvite",
    label: "CoHostInvite",
    count: () => prisma.coHostInvite.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.coHostInvite.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            eventId: true,
            email: true,
            expiresAt: true,
            acceptedAt: true,
            createdAt: true,
            tokenHash: true,
          },
        }),
      ),
  },
  {
    key: "EventCoHost",
    label: "EventCoHost",
    count: () => prisma.eventCoHost.count(),
    latest: async () =>
      sanitizeRows(await prisma.eventCoHost.findMany({ orderBy: { invitedAt: "desc" }, take: 8 })),
  },
  {
    key: "Media",
    label: "Media",
    count: () => prisma.media.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.media.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            eventId: true,
            mimeType: true,
            size: true,
            guestName: true,
            status: true,
            highlight: true,
            createdAt: true,
          },
        }),
      ),
  },
  {
    key: "GuestShotQuota",
    label: "GuestShotQuota",
    count: () => prisma.guestShotQuota.count(),
    latest: async () =>
      sanitizeRows(await prisma.guestShotQuota.findMany({ orderBy: { id: "desc" }, take: 8 })),
  },
  {
    key: "GuestMessage",
    label: "GuestMessage",
    count: () => prisma.guestMessage.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.guestMessage.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      ),
  },
  {
    key: "MediaReaction",
    label: "MediaReaction",
    count: () => prisma.mediaReaction.count(),
    latest: async () =>
      sanitizeRows(await prisma.mediaReaction.findMany({ orderBy: { createdAt: "desc" }, take: 8 })),
  },
  {
    key: "Payment",
    label: "Payment",
    count: () => prisma.payment.count(),
    latest: async () =>
      sanitizeRows(await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 10 })),
  },
  {
    key: "AdminSession",
    label: "AdminSession",
    count: () => prisma.adminSession.count(),
    latest: async () => [],
    hideRows: true,
  },
  {
    key: "AuditLog",
    label: "AuditLog",
    count: () => prisma.auditLog.count(),
    latest: async () =>
      sanitizeRows(await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 })),
  },
  {
    key: "EmailOutbox",
    label: "EmailOutbox",
    count: () => prisma.emailOutbox.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.emailOutbox.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            toEmail: true,
            template: true,
            sentAt: true,
            createdAt: true,
          },
        }),
      ),
  },
  {
    key: "UsageSnapshot",
    label: "UsageSnapshot",
    count: () => prisma.usageSnapshot.count(),
    latest: async () =>
      sanitizeRows(
        await prisma.usageSnapshot.findMany({ orderBy: { capturedAt: "desc" }, take: 5 }),
      ),
  },
];

function sanitizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => sanitizeRow(r));
}

export type AdminDatabaseSnapshot = {
  capturedAt: string;
  tables: {
    key: string;
    label: string;
    count: number;
    rows: Record<string, unknown>[];
    hideRows?: boolean;
  }[];
};

export async function getAdminDatabaseSnapshot(): Promise<AdminDatabaseSnapshot> {
  const tables = await Promise.all(
    specs.map(async (s) => ({
      key: s.key,
      label: s.label,
      count: await s.count(),
      rows: s.hideRows ? [] : await s.latest(),
      hideRows: s.hideRows,
    })),
  );
  return { capturedAt: new Date().toISOString(), tables };
}
