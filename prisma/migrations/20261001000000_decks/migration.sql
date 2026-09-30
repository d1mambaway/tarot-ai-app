-- Several decks: the user's active deck, a collection per deck, draw counts.
-- Existing collections become the "classic" deck (the current art).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deckId" TEXT NOT NULL DEFAULT 'classic';

ALTER TABLE "CardCollection" ADD COLUMN IF NOT EXISTS "deckId" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "CardCollection" ADD COLUMN IF NOT EXISTS "timesDrawn" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "CardCollection_userId_cardId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "CardCollection_userId_deckId_cardId_key" ON "CardCollection"("userId", "deckId", "cardId");
