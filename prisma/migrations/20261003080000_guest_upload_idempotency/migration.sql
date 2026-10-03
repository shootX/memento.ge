-- Guest upload client idempotency (PWA offline dedupe)
CREATE TABLE "GuestUploadIdempotency" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestUploadIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestUploadIdempotency_eventId_clientKey_key" ON "GuestUploadIdempotency"("eventId", "clientKey");
CREATE INDEX "GuestUploadIdempotency_eventId_idx" ON "GuestUploadIdempotency"("eventId");

ALTER TABLE "GuestUploadIdempotency" ADD CONSTRAINT "GuestUploadIdempotency_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
