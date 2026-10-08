-- Gallery password rotation invalidates unlock cookies
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "galleryAccessVersion" INTEGER NOT NULL DEFAULT 0;

-- Event timing (UTC instants; semantics in lib/event-schedule.ts)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "uploadOpensAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "uploadClosesAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "galleryExpiresAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "purgeAt" TIMESTAMP(3);

-- Storage quota counters (BigInt; API serializes as string)
ALTER TABLE "Event" ALTER COLUMN "totalBytes" TYPE BIGINT USING "totalBytes"::bigint;
