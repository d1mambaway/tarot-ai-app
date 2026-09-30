-- New tarot spreads and the limited new / full moon spreads
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'LOVE_FUTURE';
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'EX_RETURN';
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'TWO_PATHS';
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'CARD_ADVICE';
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'YEAR_AHEAD';
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'NEW_MOON';
ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'FULL_MOON';

-- «Прочитай меня»: what the person told about themselves, for later readings
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileFacts" JSONB;
