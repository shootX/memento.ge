-- Mobile API: bearer tokens, magic-link codes, expo push registrations

ALTER TABLE "MagicLinkToken" ADD COLUMN IF NOT EXISTS "codeHash" TEXT;
ALTER TABLE "MagicLinkToken" ADD COLUMN IF NOT EXISTS "client" TEXT;
ALTER TABLE "MagicLinkToken" ADD COLUMN IF NOT EXISTS "redirectUri" TEXT;
ALTER TABLE "MagicLinkToken" ADD COLUMN IF NOT EXISTS "consumedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "MagicLinkToken_email_createdAt_idx" ON "MagicLinkToken"("email", "createdAt");

CREATE TABLE IF NOT EXISTS "MobileAccessToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MobileAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MobileAccessToken_tokenHash_key" ON "MobileAccessToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "MobileAccessToken_userId_idx" ON "MobileAccessToken"("userId");

ALTER TABLE "MobileAccessToken" DROP CONSTRAINT IF EXISTS "MobileAccessToken_userId_fkey";
ALTER TABLE "MobileAccessToken" ADD CONSTRAINT "MobileAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MobilePushRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MobilePushRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MobilePushRegistration_expoPushToken_key" ON "MobilePushRegistration"("expoPushToken");
CREATE INDEX IF NOT EXISTS "MobilePushRegistration_eventId_idx" ON "MobilePushRegistration"("eventId");

ALTER TABLE "MobilePushRegistration" DROP CONSTRAINT IF EXISTS "MobilePushRegistration_eventId_fkey";
ALTER TABLE "MobilePushRegistration" ADD CONSTRAINT "MobilePushRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
