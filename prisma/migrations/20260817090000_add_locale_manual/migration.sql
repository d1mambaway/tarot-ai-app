-- Add localeManual: set once the user picks the app language by hand,
-- so automatic detection from Telegram no longer overwrites it on launch.
ALTER TABLE "User" ADD COLUMN "localeManual" BOOLEAN NOT NULL DEFAULT false;
