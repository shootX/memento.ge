-- AlterTable
ALTER TABLE "MagicLinkToken" ADD COLUMN "oauthPendingId" TEXT;

-- CreateTable
CREATE TABLE "OAuthNonce" (
    "id" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthPendingLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "profileName" TEXT,
    "profileImage" TEXT,
    "emailFromProvider" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthPendingLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthNonce_nonceHash_key" ON "OAuthNonce"("nonceHash");

-- CreateIndex
CREATE INDEX "OAuthNonce_expiresAt_idx" ON "OAuthNonce"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthPendingLink_tokenHash_key" ON "OAuthPendingLink"("tokenHash");

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_oauthPendingId_fkey" FOREIGN KEY ("oauthPendingId") REFERENCES "OAuthPendingLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
