/**
 * Форматы постов для автономного канала Магия Карт.
 *
 * Дима попросил не ограничиваться одной "картой дня" — нужны разные,
 * живые форматы. Ротация детерминированная (по номеру дня), без базы
 * данных: один и тот же день всегда даёт один и тот же формат/тему,
 * что даёт естественную идемпотентность при повторном вызове и не
 * требует отдельного хранилища состояния.
 */

import { MAJOR_ARCANA } from '@/data/tarot-cards';

export type ChannelPost = {
  type: string;
  title: string;
  subtitle: string;
  symbol: string;
  systemPrompt: string;
  userPrompt: string;
};

function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

const BASE_STYLE =
  'Пиши на русском, простым текстом без markdown (без звёздочек, решёток, жирного шрифта). ' +
  'Уместно вставляй 2-4 эмодзи по смыслу, не только в начале. Не упоминай ссылки и приложения ' +
  '— это добавится отдельно.';

// ─── Карта дня ────────────────────────────────────────────────────────────

function buildCardOfDay(day: number): ChannelPost {
  const card = MAJOR_ARCANA[day % MAJOR_ARCANA.length];
  const keywords = card.keywords.ru.join(', ');
  return {
    type: 'card',
    title: 'Карта дня',
    subtitle: card.name.ru,
    symbol: '🃏',
    systemPrompt:
      `Ты ведёшь Telegram-канал про таро. Пиши тёплый, живой пост "карта дня", 70-110 слов. ${BASE_STYLE} ` +
      'Не пиши название карты отдельной строкой, оно уже на картинке — просто веди рассказ по смыслу карты.',
    userPrompt: `Карта дня: ${card.name.ru}. Ключевые значения в прямом положении: ${keywords}. Напиши пост.`,
  };
}

// ─── Гороскоп дня ─────────────────────────────────────────────────────────

const ZODIAC = [
  { name: 'Овен', symbol: '♈' },
  { name: 'Телец', symbol: '♉' },
  { name: 'Близнецы', symbol: '♊' },
  { name: 'Рак', symbol: '♋' },
  { name: 'Лев', symbol: '♌' },
  { name: 'Дева', symbol: '♍' },
  { name: 'Весы', symbol: '♎' },
  { name: 'Скорпион', symbol: '♏' },
  { name: 'Стрелец', symbol: '♐' },
  { name: 'Козерог', symbol: '♑' },
  { name: 'Водолей', symbol: '♒' },
  { name: 'Рыбы', symbol: '♓' },
];

function buildHoroscope(day: number): ChannelPost {
  const sign = ZODIAC[day % ZODIAC.length];
  return {
    type: 'horoscope',
    title: 'Гороскоп дня',
    subtitle: sign.name,
    symbol: sign.symbol,
    systemPrompt:
      `Ты astrolog, ведёшь Telegram-канал про астрологию. Пиши короткий гороскоп на сегодня для ` +
      `одного знака зодиака, 70-110 слов, тон тёплый и вдохновляющий, без общих клише. ${BASE_STYLE}`,
    userPrompt: `Знак зодиака: ${sign.name}. Напиши гороскоп на сегодня.`,
  };
}

// ─── Фаза Луны ────────────────────────────────────────────────────────────

const MOON_PHASES = [
  { name: 'Новолуние', symbol: '🌑' },
  { name: 'Растущий серп', symbol: '🌒' },
  { name: 'Первая четверть', symbol: '🌓' },
  { name: 'Растущая Луна', symbol: '🌔' },
  { name: 'Полнолуние', symbol: '🌕' },
  { name: 'Убывающая Луна', symbol: '🌖' },
  { name: 'Последняя четверть', symbol: '🌗' },
  { name: 'Убывающий серп', symbol: '🌘' },
];

/** Грубый расчёт фазы Луны (синодический месяц ~29.53 дня от известного новолуния). */
function moonPhaseIndex(date: Date): number {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14); // 6 января 2000, известное новолуние
  const synodicMonth = 29.53058867;
  const daysSince = (date.getTime() - knownNewMoon) / 86_400_000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  return Math.floor((phase / synodicMonth) * MOON_PHASES.length) % MOON_PHASES.length;
}

function buildMoon(date: Date): ChannelPost {
  const phase = MOON_PHASES[moonPhaseIndex(date)];
  return {
    type: 'moon',
    title: 'Фаза Луны',
    subtitle: phase.name,
    symbol: phase.symbol,
    systemPrompt:
      `Ты ведёшь Telegram-канал про астрологию. Пиши короткий пост про текущую фазу Луны — что она ` +
      `значит для энергии дня и что стоит делать/не делать сегодня, 60-100 слов. ${BASE_STYLE}`,
    userPrompt: `Текущая фаза Луны: ${phase.name}. Напиши пост.`,
  };
}

// ─── Число дня (ангельская нумерология) ──────────────────────────────────

const ANGEL_NUMBERS = ['111', '222', '333', '444', '555', '777', '888', '999', '1010', '1111', '1212'];

function buildNumerology(day: number): ChannelPost {
  const number = ANGEL_NUMBERS[day % ANGEL_NUMBERS.length];
  return {
    type: 'numerology',
    title: 'Число дня',
    subtitle: number,
    symbol: '🔢',
    systemPrompt:
      `Ты ведёшь Telegram-канал про нумерологию. Пиши короткий пост про значение ангельского числа, ` +
      `60-100 слов. ${BASE_STYLE}`,
    userPrompt: `Ангельское число дня: ${number}. Объясни его значение и послание.`,
  };
}

// ─── Совет дня ────────────────────────────────────────────────────────────

function buildTip(): ChannelPost {
  return {
    type: 'tip',
    title: 'Послание дня',
    subtitle: '',
    symbol: '✨',
    systemPrompt:
      `Ты ведёшь Telegram-канал про таро и астрологию. Напиши короткое вдохновляющее послание/совет ` +
      `дня в мистическом духе, 40-70 слов, без конкретной карты или знака. ${BASE_STYLE}`,
    userPrompt: 'Напиши послание дня.',
  };
}

// ─── Ротация форматов ─────────────────────────────────────────────────────

type Ctx = { day: number; date: Date };

const FORMATS: Array<(ctx: Ctx) => ChannelPost> = [
  ({ day }) => buildCardOfDay(day),
  ({ day }) => buildHoroscope(day),
  ({ date }) => buildMoon(date),
  ({ day }) => buildNumerology(day),
  () => buildTip(),
];

export function buildTodaysPost(date: Date = new Date()): ChannelPost {
  const day = daysSinceEpoch(date);
  const formatIndex = day % FORMATS.length;
  return FORMATS[formatIndex]({ day, date });
}
