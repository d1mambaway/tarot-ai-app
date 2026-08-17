/**
 * Destiny Matrix (Матрица судьбы) — pure arithmetic, no external APIs.
 *
 * The chart is an octagram built from the birth date. Every position is a
 * major arcana number in 1..22 (22 stands for the Fool). Because the whole
 * thing is deterministic math, the AI never computes numbers itself — it only
 * interprets the positions we hand it, so it cannot get the arithmetic wrong.
 *
 * Layout (outer diamond + inner diagonal square + centre):
 *
 *            B (top / month)
 *      F                     G
 *  A (left/day)   E (centre)   C (right/year)
 *      I                     H
 *            D (bottom / purpose)
 */

/** Reduce any number to the 1..22 arcana range by summing its digits. */
export function reduceToArcana(n: number): number {
  let v = Math.abs(Math.trunc(n));
  while (v > 22) {
    v = String(v)
      .split('')
      .reduce((acc, d) => acc + Number(d), 0);
  }
  // 0 only happens for a 0 input; the Fool is numbered 22 in this system
  return v === 0 ? 22 : v;
}

const sumDigits = (n: number): number =>
  String(Math.abs(n))
    .split('')
    .reduce((acc, d) => acc + Number(d), 0);

/** A single point on the chart. */
export interface MatrixPoint {
  /** Position key, e.g. 'A' or 'sky' */
  key: string;
  /** Arcana number 1..22 */
  value: number;
  /** Human label per locale */
  label: { ru: string; uk: string; en: string };
}

export interface DestinyMatrix {
  /** Outer diamond: day, month, year, purpose */
  A: number;
  B: number;
  C: number;
  D: number;
  /** Centre — the "comet", core essence */
  E: number;
  /** Inner diagonal square, clockwise from top-left */
  F: number;
  G: number;
  H: number;
  I: number;
  /** Purpose lines */
  personalPurpose: number;
  socialPurpose: number;
  spiritualPurpose: number;
  /** Money channel: talent → essence → karmic tail → money point */
  moneyTalent: number;
  moneyKarmicTail: number;
  moneyPoint: number;
  /** Relationship channel */
  loveTalent: number;
  loveKarmicTail: number;
  lovePoint: number;
  /** Ancestral lines (male = F/H diagonal, female = G/I diagonal) */
  maleLine: number;
  femaleLine: number;
  /** Original input, normalised */
  input: { day: number; month: number; year: number; date: string };
}

/**
 * Parse a birth date. Accepts "DD.MM.YYYY", "DD/MM/YYYY" and "YYYY-MM-DD".
 * Throws on anything that is not a real calendar date.
 */
export function parseBirthDate(raw: string): { day: number; month: number; year: number } {
  const s = String(raw).trim();
  let day: number, month: number, year: number;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

  if (iso) {
    [, year, month, day] = iso.map(Number) as unknown as number[];
  } else if (dmy) {
    [, day, month, year] = dmy.map(Number) as unknown as number[];
  } else {
    throw new Error(`Invalid birth date: ${raw}`);
  }

  const valid =
    month >= 1 && month <= 12 && day >= 1 && year >= 1900 && year <= 2100 &&
    day <= new Date(year, month, 0).getDate();
  if (!valid) throw new Error(`Invalid birth date: ${raw}`);

  return { day, month, year };
}

/** Build the full matrix from a birth date string. */
export function calculateDestinyMatrix(birthDate: string): DestinyMatrix {
  const { day, month, year } = parseBirthDate(birthDate);

  const A = reduceToArcana(day);
  const B = reduceToArcana(month);
  const C = reduceToArcana(sumDigits(year));
  const D = reduceToArcana(A + B + C);
  const E = reduceToArcana(A + B + C + D);

  const F = reduceToArcana(A + B);
  const G = reduceToArcana(B + C);
  const H = reduceToArcana(C + D);
  const I = reduceToArcana(D + A);

  const personalPurpose = reduceToArcana(A + C);
  const socialPurpose = reduceToArcana(B + D);
  const spiritualPurpose = reduceToArcana(personalPurpose + socialPurpose);

  // Money channel runs along the F–E–H diagonal
  const moneyTalent = F;
  const moneyKarmicTail = H;
  const moneyPoint = reduceToArcana(F + E + H);

  // Relationship channel runs along the G–E–I diagonal
  const loveTalent = G;
  const loveKarmicTail = I;
  const lovePoint = reduceToArcana(G + E + I);

  const maleLine = reduceToArcana(F + H);
  const femaleLine = reduceToArcana(G + I);

  return {
    A, B, C, D, E, F, G, H, I,
    personalPurpose, socialPurpose, spiritualPurpose,
    moneyTalent, moneyKarmicTail, moneyPoint,
    loveTalent, loveKarmicTail, lovePoint,
    maleLine, femaleLine,
    input: {
      day, month, year,
      date: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`,
    },
  };
}

// ─── Arcana names (major arcana 1..22, where 22 = the Fool) ──────────────────

const ARCANA_RU = [
  'Маг', 'Верховная Жрица', 'Императрица', 'Император', 'Иерофант', 'Влюблённые',
  'Колесница', 'Сила', 'Отшельник', 'Колесо Фортуны', 'Справедливость',
  'Повешенный', 'Смерть', 'Умеренность', 'Дьявол', 'Башня', 'Звезда', 'Луна',
  'Солнце', 'Суд', 'Мир', 'Шут',
];

const ARCANA_UK = [
  'Маг', 'Верховна Жриця', 'Імператриця', 'Імператор', 'Ієрофант', 'Закохані',
  'Колісниця', 'Сила', 'Самітник', 'Колесо Фортуни', 'Справедливість',
  'Повішений', 'Смерть', 'Помірність', 'Диявол', 'Вежа', 'Зірка', 'Місяць',
  'Сонце', 'Суд', 'Світ', 'Блазень',
];

const ARCANA_EN = [
  'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement',
  'The World', 'The Fool',
];

/** Arcana image path for a matrix value (22 → the Fool artwork). */
export function arcanaImage(value: number): string {
  const id = value === 22 ? 0 : value;
  const files = [
    '00-fool', '01-magician', '02-high-priestess', '03-empress', '04-emperor',
    '05-hierophant', '06-lovers', '07-chariot', '08-strength', '09-hermit',
    '10-wheel', '11-justice', '12-hanged-man', '13-death', '14-temperance',
    '15-devil', '16-tower', '17-star', '18-moon', '19-sun', '20-judgement',
    '21-world',
  ];
  return `/cards/major/${files[id]}.webp`;
}

export function arcanaName(value: number, locale: 'ru' | 'uk' | 'en' = 'ru'): string {
  const idx = value - 1;
  const table = locale === 'uk' ? ARCANA_UK : locale === 'en' ? ARCANA_EN : ARCANA_RU;
  return table[idx] ?? '';
}

/**
 * Flatten the matrix into a labelled block for the AI prompt.
 * The model receives finished numbers and only interprets them.
 */
export function formatMatrixForPrompt(m: DestinyMatrix, locale: 'ru' | 'uk' | 'en' = 'ru'): string {
  const line = (label: string, v: number) => `${label}: ${v} (${arcanaName(v, locale)})`;
  return [
    `Дата рождения: ${m.input.date}`,
    '',
    'ЛИЧНОСТНЫЕ АРКАНЫ (внешний квадрат):',
    line('Точка A — день рождения, зона комфорта и данность', m.A),
    line('Точка B — месяц, что человек несёт в мир, качества характера', m.B),
    line('Точка C — год, талант и опора, унаследованное', m.C),
    line('Точка D — предназначение по линии судьбы, задача воплощения', m.D),
    line('Точка E — центр, Комета: главная энергия и суть личности', m.E),
    '',
    'ДИАГОНАЛЬНЫЙ КВАДРАТ (кармические зоны):',
    line('F — родовой талант по мужской линии', m.F),
    line('G — родовой талант по женской линии', m.G),
    line('H — кармический хвост, отработка', m.H),
    line('I — кармический узел в отношениях', m.I),
    '',
    'ЛИНИИ ПРЕДНАЗНАЧЕНИЯ:',
    line('Личностное предназначение (Небо)', m.personalPurpose),
    line('Социальное предназначение (Земля)', m.socialPurpose),
    line('Духовное предназначение', m.spiritualPurpose),
    '',
    'ДЕНЕЖНЫЙ КАНАЛ:',
    line('Талант, приносящий деньги', m.moneyTalent),
    line('Что блокирует доход (кармический хвост)', m.moneyKarmicTail),
    line('Точка денег — через что приходит изобилие', m.moneyPoint),
    '',
    'КАНАЛ ОТНОШЕНИЙ:',
    line('Талант в отношениях', m.loveTalent),
    line('Что мешает в отношениях', m.loveKarmicTail),
    line('Точка любви — как приходит партнёрство', m.lovePoint),
    '',
    'РОДОВЫЕ ЛИНИИ:',
    line('Мужская линия рода', m.maleLine),
    line('Женская линия рода', m.femaleLine),
  ].join('\n');
}
