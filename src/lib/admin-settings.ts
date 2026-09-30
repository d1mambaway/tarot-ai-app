/**
 * Small key/value store in the "admin_settings" table (created on demand,
 * it is not part of the Prisma schema).
 */

import { db } from './db';

async function ensureTable() {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "admin_settings" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL
    )`;
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureTable();
  const rows = await db.$queryRaw<{ value: string }[]>`
    SELECT "value" FROM "admin_settings" WHERE "key" = ${key}`;
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureTable();
  await db.$executeRaw`
    INSERT INTO "admin_settings" ("key", "value")
    VALUES (${key}, ${value})
    ON CONFLICT ("key") DO UPDATE SET "value" = ${value}`;
}
