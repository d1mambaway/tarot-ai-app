/** Format today's date as DD.MM.YYYY — used for the "horoscope today" label */
export function formatTodayShort(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

// ─── Kyiv calendar day (server-side day boundaries) ─────────────────────────
// Daily bonuses used to roll over at UTC midnight, i.e. 02:00-03:00 in Kyiv.
// Most of the audience lives in UA/RU time zones, so the day now starts at
// Kyiv midnight.

const KYIV_TZ = 'Europe/Kyiv';

function kyivParts(d: Date): { y: number; m: number; day: number; h: number; min: number; s: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KYIV_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), day: get('day'), h: get('hour'), min: get('minute'), s: get('second') };
}

/** "YYYY-MM-DD" of the Kyiv calendar day that contains `d` */
export function kyivDayKey(d: Date): string {
  const p = kyivParts(d);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** The instant (UTC Date) of Kyiv midnight that starts the day containing `now` */
export function kyivDayStart(now: Date = new Date()): Date {
  const p = kyivParts(now);
  const offsetMs = Date.UTC(p.y, p.m - 1, p.day, p.h, p.min, p.s) - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(p.y, p.m - 1, p.day) - offsetMs);
}

/** Kyiv day key of the day before the one containing `now` */
export function kyivYesterdayKey(now: Date = new Date()): string {
  return kyivDayKey(new Date(kyivDayStart(now).getTime() - 12 * 3600_000));
}
