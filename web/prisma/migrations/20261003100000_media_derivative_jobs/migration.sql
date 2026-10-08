-- Async upload derivatives (original saved first, sharp in worker queue)
ALTER TABLE "Media" ADD COLUMN "derivativesReady" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "MediaDerivativeJob" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaDerivativeJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaDerivativeJob_mediaId_key" ON "MediaDerivativeJob"("mediaId");
CREATE INDEX "MediaDerivativeJob_status_createdAt_idx" ON "MediaDerivativeJob"("status", "createdAt");

ALTER TABLE "MediaDerivativeJob" ADD CONSTRAINT "MediaDerivativeJob_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
