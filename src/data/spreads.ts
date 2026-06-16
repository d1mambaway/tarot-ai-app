/**
 * All spread types configuration
 * Defines card count, positions, pricing, and free tier limits
 */

export type SpreadCategory = 'tarot' | 'mystic' | 'photo' | 'personal';

export interface SpreadConfig {
  id: string;
  type: string; // matches ReadingType enum in Prisma
  category: SpreadCategory;
  name: { ru: string; uk: string };
  description: { ru: string; uk: string };
  icon: string;
  cardCount: number;
  positions?: { ru: string; uk: string }[]; // named positions for each card
  freePerDay: number; // 0 = paid only, -1 = unlimited
  starsCost: number; // per single reading (0 = free)
  manaCost: number; // mana cost per reading (0 = free)
  requiresInput: 'none' | 'question' | 'name' | 'photo' | 'date' | 'number' | 'dream_text' | 'two_people';
  requiresSubscription?: 'BASIC' | 'PREMIUM' | 'VIP';
  isNew?: boolean;
}

export const SPREADS: SpreadConfig[] = [
  // ─── Tarot spreads ───────────────────────────────────────────────────────
  {
    id: 'card_of_day',
    type: 'CARD_OF_DAY',
    category: 'tarot',
    name: { ru: '🌅 Карта дня', uk: '🌅 Карта дня' },
    description: {
      ru: 'Одна карта — послание на сегодня',
      uk: 'Одна карта — послання на сьогодні',
    },
    icon: '🌅',
    cardCount: 1,
    freePerDay: -1, // unlimited free
    starsCost: 0,
    manaCost: 0,
    requiresInput: 'none',
  },
  {
    id: 'yes_no',
    type: 'YES_NO',
    category: 'tarot',
    name: { ru: '✅ Да / Нет', uk: '✅ Так / Ні' },
    description: {
      ru: 'Задай вопрос — получи чёткий ответ',
      uk: 'Постав запитання — отримай чітку відповідь',
    },
    icon: '✅',
    cardCount: 1,
    freePerDay: 3,
    starsCost: 25,
    manaCost: 30,
    requiresInput: 'question',
  },
  {
    id: 'past_present_future',
    type: 'PAST_PRESENT_FUTURE',
    category: 'tarot',
    name: { ru: '⏳ Прошлое — Настоящее — Будущее', uk: '⏳ Минуле — Сьогодення — Майбутнє' },
    description: {
      ru: 'Классический расклад на 3 карты',
      uk: 'Класичний розклад на 3 карти',
    },
    icon: '⏳',
    cardCount: 3,
    positions: [
      { ru: 'Прошлое', uk: 'Минуле' },
      { ru: 'Настоящее', uk: 'Сьогодення' },
      { ru: 'Будущее', uk: 'Майбутнє' },
    ],
    freePerDay: 1,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'none',
  },
  {
    id: 'relationship',
    type: 'RELATIONSHIP',
    category: 'tarot',
    name: { ru: '💕 Отношения', uk: '💕 Стосунки' },
    description: {
      ru: 'Что чувствуете вы, он/она, и куда всё идёт',
      uk: 'Що відчуваєте ви, він/вона, і куди все йде',
    },
    icon: '💕',
    cardCount: 5,
    positions: [
      { ru: 'Твои чувства', uk: 'Твої почуття' },
      { ru: 'Его/её чувства', uk: 'Його/її почуття' },
      { ru: 'Препятствия', uk: 'Перешкоди' },
      { ru: 'Совет карт', uk: 'Порада карт' },
      { ru: 'Итог', uk: 'Підсумок' },
    ],
    freePerDay: 0,
    starsCost: 75,
    manaCost: 80,
    requiresInput: 'name',
  },
  {
    id: 'what_they_think',
    type: 'WHAT_THEY_THINK',
    category: 'tarot',
    name: { ru: '🧠 Что он/она думает обо мне', uk: '🧠 Що він/вона думає про мене' },
    description: {
      ru: 'Карты расскажут, что у него/неё в голове',
      uk: 'Карти розкажуть, що в нього/неї в голові',
    },
    icon: '🧠',
    cardCount: 3,
    positions: [
      { ru: 'Мысли о тебе', uk: 'Думки про тебе' },
      { ru: 'Чувства к тебе', uk: 'Почуття до тебе' },
      { ru: 'Намерения', uk: 'Наміри' },
    ],
    freePerDay: 0,
    starsCost: 75,
    manaCost: 80,
    requiresInput: 'name',
  },
  {
    id: 'career_money',
    type: 'CAREER_MONEY',
    category: 'tarot',
    name: { ru: '💰 Карьера и деньги', uk: '💰 Кар\'єра та гроші' },
    description: {
      ru: 'Финансовый прогноз и карьерные перспективы',
      uk: 'Фінансовий прогноз та кар\'єрні перспективи',
    },
    icon: '💰',
    cardCount: 4,
    positions: [
      { ru: 'Текущая ситуация', uk: 'Поточна ситуація' },
      { ru: 'Препятствия', uk: 'Перешкоди' },
      { ru: 'Возможности', uk: 'Можливості' },
      { ru: 'Результат', uk: 'Результат' },
    ],
    freePerDay: 0,
    starsCost: 75,
    manaCost: 80,
    requiresInput: 'none',
  },
  {
    id: 'celtic_cross',
    type: 'CELTIC_CROSS',
    category: 'tarot',
    name: { ru: '✝️ Кельтский крест', uk: '✝️ Кельтський хрест' },
    description: {
      ru: 'Самый глубокий расклад — 10 карт, полная картина',
      uk: 'Найглибший розклад — 10 карт, повна картина',
    },
    icon: '✝️',
    cardCount: 10,
    freePerDay: 0,
    starsCost: 150,
    manaCost: 200,
    requiresInput: 'question',
    requiresSubscription: 'PREMIUM',
  },
  {
    id: 'weekly',
    type: 'WEEKLY',
    category: 'tarot',
    name: { ru: '📅 Прогноз на неделю', uk: '📅 Прогноз на тиждень' },
    description: {
      ru: '7 карт — по одной на каждый день',
      uk: '7 карт — по одній на кожен день',
    },
    icon: '📅',
    cardCount: 7,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'none',
  },
  {
    id: 'monthly',
    type: 'MONTHLY',
    category: 'tarot',
    name: { ru: '🗓️ Прогноз на месяц', uk: '🗓️ Прогноз на місяць' },
    description: {
      ru: 'Общий расклад на предстоящий месяц',
      uk: 'Загальний розклад на наступний місяць',
    },
    icon: '🗓️',
    cardCount: 5,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 120,
    requiresInput: 'none',
  },
  {
    id: 'free_question',
    type: 'FREE_QUESTION',
    category: 'tarot',
    name: { ru: '❓ Свободный вопрос', uk: '❓ Вільне запитання' },
    description: {
      ru: 'Задай любой вопрос — AI выберет лучший расклад',
      uk: 'Постав будь-яке запитання — AI обере найкращий розклад',
    },
    icon: '❓',
    cardCount: 0, // AI decides
    freePerDay: 1,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'question',
  },

  // ─── Mystic / beyond tarot ───────────────────────────────────────────────
  {
    id: 'compatibility',
    type: 'COMPATIBILITY',
    category: 'mystic',
    name: { ru: '💞 Совместимость', uk: '💞 Сумісність' },
    description: {
      ru: 'Проверь совместимость с партнёром — % и разбор',
      uk: 'Перевір сумісність з партнером — % та розбір',
    },
    icon: '💞',
    cardCount: 6,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'two_people',
  },
  {
    id: 'horoscope',
    type: 'HOROSCOPE',
    category: 'mystic',
    name: { ru: '♈ Гороскоп', uk: '♈ Гороскоп' },
    description: {
      ru: 'Персональный гороскоп по знаку зодиака',
      uk: 'Персональний гороскоп за знаком зодіаку',
    },
    icon: '♈',
    cardCount: 0,
    freePerDay: 1,
    starsCost: 25,
    manaCost: 30,
    requiresInput: 'date',
  },
  {
    id: 'numerology',
    type: 'NUMEROLOGY',
    category: 'mystic',
    name: { ru: '🔢 Нумерология', uk: '🔢 Нумерологія' },
    description: {
      ru: 'Анализ личности по дате рождения и имени',
      uk: 'Аналіз особистості за датою народження та ім\'ям',
    },
    icon: '🔢',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 75,
    manaCost: 80,
    requiresInput: 'date',
  },
  {
    id: 'runes',
    type: 'RUNES',
    category: 'mystic',
    name: { ru: 'ᚱ Руны', uk: 'ᚱ Руни' },
    description: {
      ru: 'Скандинавские руны — древнее гадание',
      uk: 'Скандинавські руни — давнє ворожіння',
    },
    icon: 'ᚱ',
    cardCount: 3,
    freePerDay: 1,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'question',
  },
  {
    id: 'dream',
    type: 'DREAM',
    category: 'mystic',
    name: { ru: '💤 Толкование снов', uk: '💤 Тлумачення снів' },
    description: {
      ru: 'Опиши свой сон — AI разберёт символы',
      uk: 'Опиши свій сон — AI розбере символи',
    },
    icon: '💤',
    cardCount: 0,
    freePerDay: 1,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'dream_text',
  },
  {
    id: 'angel_numbers',
    type: 'ANGEL_NUMBERS',
    category: 'mystic',
    name: { ru: '👼 Ангельские числа', uk: '👼 Ангельські числа' },
    description: {
      ru: 'Видишь число повсюду? Узнай что оно значит',
      uk: 'Бачиш число всюди? Дізнайся що воно означає',
    },
    icon: '👼',
    cardCount: 0,
    freePerDay: 3,
    starsCost: 0,
    manaCost: 0,
    requiresInput: 'number',
  },
  {
    id: 'moon_phase',
    type: 'MOON_PHASE',
    category: 'mystic',
    name: { ru: '🌙 Фазы луны', uk: '🌙 Фази місяця' },
    description: {
      ru: 'Рекомендации на сегодня по лунному календарю',
      uk: 'Рекомендації на сьогодні за місячним календарем',
    },
    icon: '🌙',
    cardCount: 0,
    freePerDay: -1,
    starsCost: 0,
    manaCost: 0,
    requiresInput: 'none',
  },
  {
    id: 'past_lives',
    type: 'PAST_LIVES',
    category: 'mystic',
    name: { ru: '🕰️ Прошлые жизни', uk: '🕰️ Минулі життя' },
    description: {
      ru: 'Кем ты был в прошлой жизни? AI расскажет',
      uk: 'Ким ти був у минулому житті? AI розкаже',
    },
    icon: '🕰️',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 120,
    requiresInput: 'date',
    isNew: true,
  },
  {
    id: 'chakra',
    type: 'CHAKRA',
    category: 'mystic',
    name: { ru: '🧘 Чакры', uk: '🧘 Чакри' },
    description: {
      ru: 'Какая чакра заблокирована? Советы по раскрытию',
      uk: 'Яка чакра заблокована? Поради щодо розкриття',
    },
    icon: '🧘',
    cardCount: 7,
    freePerDay: 0,
    starsCost: 75,
    manaCost: 80,
    requiresInput: 'none',
  },

  // ─── Photo-based ─────────────────────────────────────────────────────────
  {
    id: 'palm_reading',
    type: 'PALM_READING',
    category: 'photo',
    name: { ru: '🤚 Хиромантия', uk: '🤚 Хіромантія' },
    description: {
      ru: 'Фото ладони — AI прочитает линии',
      uk: 'Фото долоні — AI прочитає лінії',
    },
    icon: '🤚',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'photo',
    isNew: true,
  },
  {
    id: 'aura_reading',
    type: 'AURA_READING',
    category: 'photo',
    name: { ru: '✨ Аура по фото', uk: '✨ Аура за фото' },
    description: {
      ru: 'Селфи → цвет ауры + интерпретация',
      uk: 'Селфі → колір аури + інтерпретація',
    },
    icon: '✨',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'photo',
    isNew: true,
  },

  // ─── Personal / cold reading ─────────────────────────────────────────────
  {
    id: 'psych_portrait',
    type: 'PSYCH_PORTRAIT',
    category: 'personal',
    name: { ru: '🧠 Прочитай меня', uk: '🧠 Прочитай мене' },
    description: {
      ru: 'AI составит твой психологический портрет',
      uk: 'AI складе твій психологічний портрет',
    },
    icon: '🧠',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'question', // series of questions
    isNew: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getSpreadById(id: string): SpreadConfig | undefined {
  return SPREADS.find((s) => s.id === id);
}

export function getSpreadsByCategory(category: SpreadCategory): SpreadConfig[] {
  return SPREADS.filter((s) => s.category === category);
}

export function getFreeSpreads(): SpreadConfig[] {
  return SPREADS.filter((s) => s.freePerDay !== 0);
}
