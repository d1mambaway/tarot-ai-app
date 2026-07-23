/**
 * User memory — lets the oracle "remember" a user's last few readings so that
 * new interpretations and reminders land precisely instead of feeling random.
 *
 * Deliberately lightweight: no extra table, just a compact summary built from
 * the existing Reading rows. Kept short (~300-500 chars) so it doesn't bloat
 * the prompt or leak full past interpretations verbatim.
 */

import { db } from '@/lib/db';

type Locale = 'ru' | 'uk' | 'en';

const READING_TYPE_LABEL: Record<string, Record<Locale, string>> = {
  CARD_OF_DAY: { ru: 'карта дня', uk: 'карта дня', en: 'card of the day' },
  YES_NO: { ru: 'расклад да/нет', uk: 'розклад так/ні', en: 'yes/no reading' },
  PAST_PRESENT_FUTURE: { ru: 'прошлое-настоящее-будущее', uk: 'минуле-теперішнє-майбутнє', en: 'past-present-future' },
  RELATIONSHIP: { ru: 'расклад на отношения', uk: 'розклад на стосунки', en: 'relationship reading' },
  WHAT_THEY_THINK: { ru: 'что думает другой человек', uk: 'що думає інша людина', en: 'what they think' },
  CAREER_MONEY: { ru: 'карьера и деньги', uk: 'кар\u2019єра і гроші', en: 'career and money' },
  CELTIC_CROSS: { ru: 'кельтский крест', uk: 'кельтський хрест', en: 'celtic cross' },
  WEEKLY: { ru: 'расклад на неделю', uk: 'розклад на тиждень', en: 'weekly reading' },
  MONTHLY: { ru: 'расклад на месяц', uk: 'розклад на місяць', en: 'monthly reading' },
  BIRTHDAY: { ru: 'расклад на день рождения', uk: 'розклад на день народження', en: 'birthday reading' },
  FREE_QUESTION: { ru: 'свободный вопрос', uk: 'вільне питання', en: 'free question' },
  COMPATIBILITY: { ru: 'совместимость', uk: 'сумісність', en: 'compatibility' },
  NUMEROLOGY: { ru: 'нумерология', uk: 'нумерологія', en: 'numerology' },
  RUNES: { ru: 'руны', uk: 'руни', en: 'runes' },
  DREAM: { ru: 'толкование сна', uk: 'тлумачення сну', en: 'dream interpretation' },
  PAST_LIVES: { ru: 'прошлые жизни', uk: 'минулі життя', en: 'past lives' },
  CHAKRA: { ru: 'чакры', uk: 'чакри', en: 'chakras' },
  ANGEL_NUMBERS: { ru: 'ангельские числа', uk: 'ангельські числа', en: 'angel numbers' },
  MOON_PHASE: { ru: 'фаза луны', uk: 'фаза місяця', en: 'moon phase' },
  PSYCH_PORTRAIT: { ru: 'психологический портрет', uk: 'психологічний портрет', en: 'psychological portrait' },
  HOROSCOPE: { ru: 'гороскоп', uk: 'гороскоп', en: 'horoscope' },
  NATAL_CHART: { ru: 'натальная карта', uk: 'натальна карта', en: 'natal chart' },
};

function daysAgo(date: Date, locale: Locale): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return locale === 'en' ? 'today' : locale === 'uk' ? 'сьогодні' : 'сегодня';
  if (days === 1) return locale === 'en' ? 'yesterday' : locale === 'uk' ? 'вчора' : 'вчера';
  if (locale === 'en') return `${days} days ago`;
  if (locale === 'uk') return `${days} дн. тому`;
  return `${days} дн. назад`;
}

/**
 * Builds a compact text block describing a user's last N readings, to be
 * injected into the system prompt so the oracle can reference real context
 * instead of writing something generic/random.
 */
export async function buildUserMemoryContext(
  userId: string,
  locale: Locale,
  opts: { take?: number; excludeReadingId?: string } = {},
): Promise<string | undefined> {
  const take = opts.take ?? 3;

  const readings = await db.reading.findMany({
    where: {
      userId,
      ...(opts.excludeReadingId ? { id: { not: opts.excludeReadingId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
    select: { type: true, question: true, interpretation: true, createdAt: true },
  });

  if (readings.length === 0) return undefined;

  const lines = readings.map((r) => {
    const label = READING_TYPE_LABEL[r.type]?.[locale] || r.type.toLowerCase();
    const when = daysAgo(r.createdAt, locale);
    const q = r.question?.trim();
    const gist = r.interpretation.replace(/\s+/g, ' ').trim().slice(0, 160);
    const qPart = q ? ` — «${q.slice(0, 100)}»` : '';
    return `- (${when}) ${label}${qPart}: ${gist}...`;
  });

  return lines.join('\n');
}

/**
 * Fetches the single most recent reading for a user — used by the follow-up
 * reminder job to know what to gently circle back to.
 */
export async function getLatestReadingForReminder(userId: string) {
  return db.reading.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
