-- Premium gifts: bought by one user, redeemed once by another
CREATE TABLE IF NOT EXISTS "PremiumGift" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "buyerTelegramId" BIGINT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "redeemedByTelegramId" BIGINT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PremiumGift_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PremiumGift_code_key" ON "PremiumGift"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PremiumGift_chargeId_key" ON "PremiumGift"("chargeId");
CREATE INDEX IF NOT EXISTS "PremiumGift_buyerTelegramId_idx" ON "PremiumGift"("buyerTelegramId");
