/**
 * Sessions for the standalone Android app (no Telegram).
 *
 * The app keeps a random device key. The server turns it into a stable
 * account id and signs an initData string exactly the way Telegram does
 * (HMAC with the bot token), so every existing API route accepts it as is.
 * App accounts use negative ids, which Telegram never issues: they never
 * collide with Telegram users and bot messages are skipped for them.
 */

import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export const DEVICE_KEY_RE = /^[A-Za-z0-9_-]{32,128}$/;

/** Stable negative account id for a device key (48 bits, safe integer) */
export function appUserId(deviceKey: string): number {
  const h = crypto.createHash('sha256').update(`app-device:${deviceKey}`).digest();
  return -(h.readUIntBE(0, 6) || 1);
}

/** App accounts have negative ids */
export function isAppUserId(id: number | bigint | string): boolean {
  return BigInt(id) < BigInt(0);
}

/** initData signed like Telegram's, accepted by validateInitData() */
export function signInitData(fields: Record<string, string>, botToken: string = BOT_TOKEN): string {
  const dataCheckString = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const params = new URLSearchParams(fields);
  params.set('hash', hash);
  return params.toString();
}

export function appInitData(deviceKey: string, opts: { name?: string; lang?: string } = {}): { initData: string; userId: number } {
  const userId = appUserId(deviceKey);
  const lang = ['ru', 'uk', 'en'].includes(opts.lang || '') ? opts.lang! : 'ru';
  const user = {
    id: userId,
    first_name: (opts.name || '').trim().slice(0, 40) || (lang === 'en' ? 'Guest' : lang === 'uk' ? 'Гість' : 'Гость'),
    language_code: lang,
  };
  const initData = signInitData({
    auth_date: String(Math.floor(Date.now() / 1000)),
    platform: 'android_app',
    user: JSON.stringify(user),
  });
  return { initData, userId };
}
