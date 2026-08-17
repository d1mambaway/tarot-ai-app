-- CreateEnum
CREATE TYPE "ReadingType" AS ENUM ('CARD_OF_DAY', 'YES_NO', 'PAST_PRESENT_FUTURE', 'RELATIONSHIP', 'WHAT_THEY_THINK', 'CAREER_MONEY', 'CELTIC_CROSS', 'WEEKLY', 'MONTHLY', 'BIRTHDAY', 'FREE_QUESTION', 'COMPATIBILITY', 'NUMEROLOGY', 'RUNES', 'DREAM', 'PAST_LIVES', 'CHAKRA', 'ANGEL_NUMBERS', 'MOON_PHASE', 'PSYCH_PORTRAIT', 'HOROSCOPE', 'NATAL_CHART');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ru',
    "birthDate" TIMESTAMP(3),
    "zodiacSign" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "mana" INTEGER NOT NULL DEFAULT 0,
    "channelSubBonus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),
    "freeReadsToday" INTEGER NOT NULL DEFAULT 0,
    "freeReadsReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bonusReads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReadingType" NOT NULL,
    "question" TEXT,
    "cards" JSONB NOT NULL,
    "interpretation" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ru',
    "manaCost" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerName" TEXT,
    "partnerSign" TEXT,
    "followupCount" INTEGER NOT NULL DEFAULT 0,
    "reminderSentAt" TIMESTAMP(3),

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'ACTIVE',
    "starsTxId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "userId" TEXT,
    "starsAmount" INTEGER NOT NULL,
    "manaAmount" INTEGER NOT NULL DEFAULT 0,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT,
    "telegramPayId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "bonusGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "Reading_userId_createdAt_idx" ON "Reading"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_telegramPayId_key" ON "Payment"("telegramPayId");

-- CreateIndex
CREATE INDEX "Payment_telegramId_idx" ON "Payment"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "RateLimit_key_createdAt_idx" ON "RateLimit"("key", "createdAt");

-- CreateIndex
CREATE INDEX "CardCollection_userId_idx" ON "CardCollection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardCollection_userId_cardId_key" ON "CardCollection"("userId", "cardId");

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCollection" ADD CONSTRAINT "CardCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

