/**
 * Moon ephemeris for the home widget. Everything is computed on the device
 * with astronomy-engine (no network): phase, illumination, zodiac sign of the
 * Moon, the next new/full moon and the lunar day.
 *
 * Lunar day follows the classic rule: day 1 starts at the new moon, every
 * next day starts at a moonrise. Moonrise depends on the place, so we use
 * Kyiv as the reference city for everyone.
 */

import * as Astronomy from 'astronomy-engine';

export type PhaseKey =
  | 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export const PHASE_ORDER: PhaseKey[] = [
  'new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full', 'waning_gibbous', 'last_quarter', 'waning_crescent',
];

export interface MoonInfo {
  /** 0 = new, 90 = first quarter, 180 = full, 270 = last quarter */
  phaseAngle: number;
  phase: PhaseKey;
  /** 0..100 */
  illumination: number;
  waxing: boolean;
  /** 0 = Aries … 11 = Pisces */
  signIndex: number;
  /** Next sign change (the Moon moves to the next sign) */
  signChangeAt: Date;
  lunarDay: number;
  lunarDayStart: Date;
  nextNew: Date;
  nextFull: Date;
  computedAt: Date;
}

export const KYIV = new Astronomy.Observer(50.4501, 30.5234, 170);
const DAY = 86400000;

// ±12° around an exact phase (about a day) counts as that phase
export function phaseFromAngle(a: number): PhaseKey {
  const x = ((a % 360) + 360) % 360;
  if (x < 12 || x >= 348) return 'new';
  if (x < 78) return 'waxing_crescent';
  if (x < 102) return 'first_quarter';
  if (x < 168) return 'waxing_gibbous';
  if (x < 192) return 'full';
  if (x < 258) return 'waning_gibbous';
  if (x < 282) return 'last_quarter';
  return 'waning_crescent';
}

function moonLongitude(date: Date): number {
  return Astronomy.EclipticGeoMoon(date).lon;
}

/** When the Moon leaves its current sign (binary search, ~1 min precision) */
function findSignChange(date: Date): Date {
  const sign = Math.floor(moonLongitude(date) / 30);
  let lo = date.getTime();
  let hi = lo + 3 * DAY;
  // Make sure hi is already in another sign (the Moon spends ≤ 2.7 days in one)
  if (Math.floor(moonLongitude(new Date(hi)) / 30) === sign) hi = lo + 4 * DAY;
  while (hi - lo > 60000) {
    const mid = (lo + hi) / 2;
    if (Math.floor(moonLongitude(new Date(mid)) / 30) === sign) lo = mid;
    else hi = mid;
  }
  return new Date(hi);
}

function previousNewMoon(date: Date): Date {
  let t = new Date(date.getTime() - 31 * DAY);
  let prev = t;
  for (let i = 0; i < 3; i++) {
    const r = Astronomy.SearchMoonPhase(0, t, 40);
    if (!r || r.date.getTime() > date.getTime()) break;
    prev = r.date;
    t = new Date(r.date.getTime() + DAY);
  }
  return prev;
}

function lunarDay(date: Date, newMoon: Date): { day: number; start: Date } {
  let day = 1;
  let start = newMoon;
  let t = newMoon;
  for (let i = 0; i < 32; i++) {
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, KYIV, +1, t, 2);
    if (!rise || rise.date.getTime() > date.getTime()) break;
    day += 1;
    start = rise.date;
    t = new Date(rise.date.getTime() + 60000);
  }
  return { day: Math.min(day, 30), start };
}

export function getMoonInfo(date: Date = new Date()): MoonInfo {
  const phaseAngle = Astronomy.MoonPhase(date);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction;
  const prevNew = previousNewMoon(date);
  const ld = lunarDay(date, prevNew);
  return {
    phaseAngle,
    phase: phaseFromAngle(phaseAngle),
    illumination: Math.round(illum * 100),
    waxing: phaseAngle < 180,
    signIndex: Math.floor(moonLongitude(date) / 30) % 12,
    signChangeAt: findSignChange(date),
    lunarDay: ld.day,
    lunarDayStart: ld.start,
    nextNew: Astronomy.SearchMoonPhase(0, date, 40)!.date,
    nextFull: Astronomy.SearchMoonPhase(180, date, 40)!.date,
    computedAt: date,
  };
}

/** Whole days until a date, rounded the way people count («через 5 дней») */
export function daysUntil(target: Date, from: Date = new Date()): number {
  return Math.max(0, Math.round((target.getTime() - from.getTime()) / DAY));
}

// Cached for 10 minutes: computed once behind the loading screen, then the
// home widget reads it without blocking the first paint
let cache: { at: number; info: MoonInfo } | null = null;

export function getMoonInfoCached(now: Date = new Date()): MoonInfo {
  if (cache && Math.abs(now.getTime() - cache.at) < 10 * 60 * 1000) return cache.info;
  const info = getMoonInfo(now);
  cache = { at: now.getTime(), info };
  return info;
}

export function warmMoonInfo(): void {
  try {
    getMoonInfoCached();
  } catch {
    /* the widget will retry */
  }
}

/** Calendar day in Kyiv as "YYYY-MM-DD" (falls back to the device zone) */
export function kyivDay(d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kiev', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
}

/**
 * Window for the limited moon spreads: 36 h either side of the exact new /
 * full moon (three days in all). `open` says whether the spread can be done
 * now; otherwise `opensAt` is when the next window starts.
 */
export const MOON_WINDOW_HOURS = 36;

export function moonSpreadWindow(kind: 'new' | 'full', now: Date = new Date()): { open: boolean; opensAt: Date; closesAt: Date; exact: Date } {
  const half = MOON_WINDOW_HOURS * 3600 * 1000;
  // The first such moon that has not yet left its window
  const exact = Astronomy.SearchMoonPhase(kind === 'new' ? 0 : 180, new Date(now.getTime() - half), 40)!.date;
  const opensAt = new Date(exact.getTime() - half);
  const closesAt = new Date(exact.getTime() + half);
  return { open: now >= opensAt && now < closesAt, opensAt, closesAt, exact };
}
