-- Premium savings counter, 1 free big report per month on premium,
-- first-reading-free flag, acquisition source, claimed achievements
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "premiumSaved" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "premiumBigReportAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstReadingFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "achievementsClaimed" TEXT[] DEFAULT ARRAY[]::TEXT[];
