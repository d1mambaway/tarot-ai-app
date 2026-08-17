/**
 * Database-backed rate limiter for Vercel serverless functions.
 *
 * Uses PostgreSQL (via Prisma raw queries) instead of in-memory Map,
 * so rate limits work correctly across serverless instances.
 *
 * Falls back to in-memory if DB query fails (network blip, cold start).
 */

import { db } from './db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── In-memory fallback (for when DB is unavailable) ─────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const fallbackStore = new Map<string, RateLimitEntry>();

function checkFallback(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = fallbackStore.get(key);

  if (!entry || now > entry.resetAt) {
    fallbackStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ─── DB-backed rate limiter ──────────────────────────────────────────────────

/**
 * Check rate limit for a given key using the database.
 *
 * @param key      - Unique identifier (IP address, user ID, etc.)
 * @param limit    - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60s)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  try {
    // Count requests in the current window
    const result = await db.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) as cnt FROM "RateLimit"
      WHERE "key" = ${key}
        AND "createdAt" > ${windowStart}`;

    const count = Number(result[0]?.cnt ?? 0);

    if (count >= limit) {
      // Find the oldest entry in the window to calculate reset time
      const oldest = await db.$queryRaw<{ ca: Date }[]>`
        SELECT MIN("createdAt") as ca FROM "RateLimit"
        WHERE "key" = ${key}
          AND "createdAt" > ${windowStart}`;
      const resetAt = oldest[0]?.ca
        ? new Date(oldest[0].ca).getTime() + windowMs
        : now + windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    // Record this request
    await db.$executeRaw`
      INSERT INTO "RateLimit" ("id", "key", "createdAt")
      VALUES (gen_random_uuid(), ${key}, NOW())`;

    // Periodic cleanup: delete entries older than 2× window (best-effort, ~5% chance)
    if (Math.random() < 0.05) {
      const cutoff = new Date(now - windowMs * 2);
      db.$executeRaw`DELETE FROM "RateLimit" WHERE "createdAt" < ${cutoff}`.catch(() => {});
    }

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: now + windowMs,
    };
  } catch (err) {
    // DB unavailable — fall back to in-memory
    console.warn('Rate limit DB query failed, using fallback:', err);
    return checkFallback(key, limit, windowMs);
  }
}

/**
 * Extract a rate-limit key from the request.
 * Uses X-Forwarded-For (Vercel sets this), falls back to a generic key.
 */
export function getUserRateLimitKey(telegramId: number | string | bigint, prefix: string): string {
  return `${prefix}:tg:${telegramId}`;
}

/**
 * IP-based key. Only for endpoints that have no authenticated user yet —
 * mobile carriers put thousands of Telegram users behind one address, so an
 * IP limit either throttles innocent users or is set so high it stops nothing.
 * Prefer getUserRateLimitKey() once initData has been validated.
 */
export function getRateLimitKey(req: Request, prefix: string = ''): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${prefix}:${ip}`;
}
