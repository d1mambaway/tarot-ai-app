-- Personalization: grammatical gender + preferred display name for readings
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
