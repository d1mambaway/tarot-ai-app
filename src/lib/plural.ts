/**
 * Plural forms for counters: «1 день / 2 дня / 5 дней».
 * Russian and Ukrainian share the same three-form rule.
 */

type Locale = 'ru' | 'uk' | 'en';

export function pluralForm(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

const DAY_FORMS: Record<Locale, [string, string, string]> = {
  ru: ['день', 'дня', 'дней'],
  uk: ['день', 'дні', 'днів'],
  en: ['day', 'days', 'days'],
};

/** «1 день», «3 дні», «5 days» */
export function daysLabel(n: number, locale: Locale): string {
  if (locale === 'en') return `${n} ${n === 1 ? 'day' : 'days'}`;
  const [one, few, many] = DAY_FORMS[locale];
  return `${n} ${pluralForm(n, one, few, many)}`;
}
