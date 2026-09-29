/**
 * Shared-secret checks for server-to-server endpoints (Telegram webhook, Vercel Cron).
 *
 * Fail closed: when the secret env var is missing in production the endpoint
 * refuses every request instead of silently turning protection off. Before,
 * a forgotten TELEGRAM_WEBHOOK_SECRET let anyone POST a fake
 * `successful_payment` update (free mana / premium) or an admin command.
 * Outside production (local dev, tests) a missing secret still lets requests
 * through so the app can be run without configuring everything.
 */

import crypto from 'crypto';

function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * True when `provided` matches the secret in `envName`.
 * Missing secret: false in production (logged loudly), true elsewhere.
 */
export function secretMatches(envName: string, provided: string | null | undefined): boolean {
  const expected = process.env[envName];
  if (!expected) {
    if (isProduction()) {
      console.error(`[security] ${envName} is not set — refusing request. Set it in Vercel env.`);
      return false;
    }
    return true;
  }
  return !!provided && safeEqual(provided, expected);
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
export function cronAuthorized(authorizationHeader: string | null): boolean {
  const token = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;
  return secretMatches('CRON_SECRET', token);
}

/** Telegram echoes setWebhook's secret_token in this header on every update. */
export function telegramWebhookAuthorized(secretHeader: string | null): boolean {
  return secretMatches('TELEGRAM_WEBHOOK_SECRET', secretHeader);
}
