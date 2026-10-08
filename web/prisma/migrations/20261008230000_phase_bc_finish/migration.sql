CREATE TABLE IF NOT EXISTS "MediaExportJob" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "storageKey" TEXT,
    "bytesWritten" BIGINT NOT NULL DEFAULT 0,
    "mediaTotal" INTEGER NOT NULL DEFAULT 0,
    "mediaDone" INTEGER NOT NULL DEFAULT 0,
    "resumeAfterMediaId" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "leasedBy" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaExportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MediaExportJob_idempotencyKey_key" ON "MediaExportJob"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "MediaExportJob_eventId_status_idx" ON "MediaExportJob"("eventId", "status");

ALTER TABLE "MediaExportJob" ADD CONSTRAINT "MediaExportJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailOutbox" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "EmailOutbox_idempotencyKey_key" ON "EmailOutbox"("idempotencyKey");
ALTER TABLE "EmailOutbox" ADD COLUMN IF NOT EXISTS "deadAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PartnerCreditLedger" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerCreditLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnerCreditLedger_partnerId_createdAt_idx" ON "PartnerCreditLedger"("partnerId", "createdAt");

ALTER TABLE "PartnerCreditLedger" ADD CONSTRAINT "PartnerCreditLedger_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MediaReport" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "guestKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MediaReport_eventId_idx" ON "MediaReport"("eventId");
