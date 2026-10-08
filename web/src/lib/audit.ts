import { prisma } from "@/lib/prisma";

export async function auditLog(opts: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: opts.userId,
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    },
  });
}
