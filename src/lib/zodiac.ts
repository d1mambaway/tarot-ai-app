/**
 * Zodiac helpers shared by the moon widget and the profile API.
 * Tropical zodiac, sign boundaries by date of birth (no birth time needed).
 */

export type Locale = 'ru' | 'uk' | 'en';

export const SIGN_KEYS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type SignKey = (typeof SIGN_KEYS)[number];

// U+FE0E forces the text (not emoji) presentation, so glyphs stay gold and thin
export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + '\uFE0E');

/** Nominative: «Скорпион» */
export const SIGN_NAMES: Record<Locale, string[]> = {
  ru: ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'],
  uk: ['Овен', 'Телець', 'Близнюки', 'Рак', 'Лев', 'Діва', 'Терези', 'Скорпіон', 'Стрілець', 'Козеріг', 'Водолій', 'Риби'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
};

/** Locative after «в / у / in»: «Луна в Раке» */
export const SIGN_IN: Record<Locale, string[]> = {
  ru: ['Овне', 'Тельце', 'Близнецах', 'Раке', 'Льве', 'Деве', 'Весах', 'Скорпионе', 'Стрельце', 'Козероге', 'Водолее', 'Рыбах'],
  uk: ['Овні', 'Тельці', 'Близнюках', 'Раку', 'Леві', 'Діві', 'Терезах', 'Скорпіоні', 'Стрільці', 'Козерозі', 'Водолії', 'Рибах'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
};

/** fire, earth, air, water */
export const SIGN_ELEMENT = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

// Start day of each sign, as [month (1-12), day]. Aries starts on March 21.
const STARTS: [number, number][] = [
  [3, 21], [4, 20], [5, 21], [6, 21], [7, 23], [8, 23],
  [9, 23], [10, 23], [11, 22], [12, 22], [1, 20], [2, 19],
];

/** Sun sign index (0 = Aries) for a calendar date */
export function signIndexFromDate(month: number, day: number): number {
  const md = month * 100 + day;
  // Walk backwards through the year: the last start that is <= date wins
  let best = 9; // Capricorn covers Dec 22 .. Jan 19
  let bestMd = -1;
  STARTS.forEach(([m, d], i) => {
    const s = m * 100 + d;
    if (s <= md && s > bestMd) {
      bestMd = s;
      best = i;
    }
  });
  return best;
}

/** Parse "YYYY-MM-DD" safely (no timezone shift). Returns null when invalid. */
export function parseBirthDate(raw: unknown): { y: number; m: number; d: number } | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  if (y < 1900 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  if (dt.getTime() > Date.now()) return null;
  return { y, m: mo, d };
}

export function signKeyFromBirthDate(raw: string): SignKey | null {
  const p = parseBirthDate(raw);
  return p ? SIGN_KEYS[signIndexFromDate(p.m, p.d)] : null;
}
