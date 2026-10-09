-- Host capability token hashing
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "hostTokenHash" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "hostCapabilityRevoked" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "Event_hostTokenHash_key" ON "Event"("hostTokenHash");

-- Webhook processing state machine
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'succeeded';
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "leaseUntil" TIMESTAMP(3);
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3);

-- Upload reservations (idempotency at start)
CREATE TABLE IF NOT EXISTS "GuestUploadReservation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reservedBytes" INTEGER NOT NULL,
    "mediaId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestUploadReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuestUploadReservation_eventId_clientKey_key" ON "GuestUploadReservation"("eventId", "clientKey");
CREATE INDEX IF NOT EXISTS "GuestUploadReservation_eventId_status_idx" ON "GuestUploadReservation"("eventId", "status");
CREATE INDEX IF NOT EXISTS "GuestUploadReservation_expiresAt_idx" ON "GuestUploadReservation"("expiresAt");

ALTER TABLE "GuestUploadReservation" ADD CONSTRAINT "GuestUploadReservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Media originals vs derivatives
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "originalKey" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "displayKey" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "posterKey" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "contentSha256" TEXT;

UPDATE "Media" SET "originalKey" = "storageKey" WHERE "originalKey" IS NULL;

-- Postgres-backed rate limits
CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
    "bucketKey" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("bucketKey")
);

-- Job lease fields for derivative worker
ALTER TABLE "MediaDerivativeJob" ADD COLUMN IF NOT EXISTS "leaseUntil" TIMESTAMP(3);
ALTER TABLE "MediaDerivativeJob" ADD COLUMN IF NOT EXISTS "leasedBy" TEXT;
