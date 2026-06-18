/**
 * All spread types configuration
 * Defines card count, positions, pricing, and free tier limits
 */

export type SpreadCategory = 'tarot' | 'esoteric' | 'photo' | 'personal';
export type Locale = 'ru' | 'uk' | 'en';
export type L = Record<Locale, string>;

export interface SpreadConfig {
  id: string;
  type: string;
  category: SpreadCategory;
  name: L;
  description: L;
  icon: string;
  image?: string;
  cardCount: number;
  positions?: L[];
  freePerDay: number;
  starsCost: number;
  manaCost: number;
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
    name: { ru: '🌅 Карта дня', uk: '🌅 Карта дня', en: '🌅 Card of the Day' },
    description: {
      ru: 'Одна карта — послание на сегодня',
      uk: 'Одна карта — послання на сьогодні',
      en: 'One card — your message for today',
    },
    icon: '🌅',
    cardCount: 1,
    freePerDay: -1,
    starsCost: 0,
    manaCost: 0,
    requiresInput: 'none',
  },
  {
    id: 'yes_no',
    type: 'YES_NO',
    category: 'tarot',
    name: { ru: '✅ Да / Нет', uk: '✅ Так / Ні', en: '✅ Yes / No' },
    description: {
      ru: 'Задай вопрос — получи чёткий ответ',
      uk: 'Постав запитання — отримай чітку відповідь',
      en: 'Ask a question — get a clear answer',
    },
    icon: '✅',
    image: '/ui/spreads/yes_no.webp',
    cardCount: 1,
    freePerDay: 0,
    starsCost: 25,
    manaCost: 50,
    requiresInput: 'question',
  },
  {
    id: 'past_present_future',
    type: 'PAST_PRESENT_FUTURE',
    category: 'tarot',
    name: { ru: '⏳ Прошлое — Настоящее — Будущее', uk: '⏳ Минуле — Сьогодення — Майбутнє', en: '⏳ Past — Present — Future' },
    description: {
      ru: 'Классический расклад на 3 карты',
      uk: 'Класичний розклад на 3 карти',
      en: 'Classic 3-card spread',
    },
    icon: '⏳',
    image: '/ui/spreads/past_present_future.webp',
    cardCount: 3,
    positions: [
      { ru: 'Прошлое', uk: 'Минуле', en: 'Past' },
      { ru: 'Настоящее', uk: 'Сьогодення', en: 'Present' },
      { ru: 'Будущее', uk: 'Майбутнє', en: 'Future' },
    ],
    freePerDay: 0,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'none',
  },
  {
    id: 'relationship',
    type: 'RELATIONSHIP',
    category: 'tarot',
    name: { ru: '💕 Отношения', uk: '💕 Стосунки', en: '💕 Relationship' },
    description: {
      ru: 'Что чувствуете вы, он/она, и куда всё идёт',
      uk: 'Що відчуваєте ви, він/вона, і куди все йде',
      en: 'What you both feel and where it\'s going',
    },
    icon: '💕',
    image: '/ui/spreads/relationship.webp',
    cardCount: 5,
    positions: [
      { ru: 'Твои чувства', uk: 'Твої почуття', en: 'Your feelings' },
      { ru: 'Его/её чувства', uk: 'Його/її почуття', en: 'Their feelings' },
      { ru: 'Препятствия', uk: 'Перешкоди', en: 'Obstacles' },
      { ru: 'Совет карт', uk: 'Порада карт', en: 'Cards\' advice' },
      { ru: 'Итог', uk: 'Підсумок', en: 'Outcome' },
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
    name: { ru: '🧠 Что он/она думает обо мне', uk: '🧠 Що він/вона думає про мене', en: '🧠 What do they think of me' },
    description: {
      ru: 'Карты расскажут, что у него/неё в голове',
      uk: 'Карти розкажуть, що в нього/неї в голові',
      en: 'Cards reveal what\'s on their mind',
    },
    icon: '🧠',
    image: '/ui/spreads/what_they_think.webp',
    cardCount: 3,
    positions: [
      { ru: 'Его мысли', uk: 'Його думки', en: 'Their thoughts' },
      { ru: 'Его чувства', uk: 'Його почуття', en: 'Their feelings' },
      { ru: 'Его подсознание', uk: 'Його підсвідомість', en: 'Their subconscious' },
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
    name: { ru: '💰 Карьера и деньги', uk: '💰 Кар\'єра та гроші', en: '💰 Career & Money' },
    description: {
      ru: 'Финансовый прогноз и карьерные перспективы',
      uk: 'Фінансовий прогноз та кар\'єрні перспективи',
      en: 'Financial forecast and career outlook',
    },
    icon: '💰',
    image: '/ui/spreads/career_money.webp',
    cardCount: 3,
    positions: [
      { ru: 'Где я сейчас', uk: 'Де я зараз', en: 'Where I am now' },
      { ru: 'Препятствия', uk: 'Перешкоди', en: 'Obstacles' },
      { ru: 'Что делать', uk: 'Що робити', en: 'What to do' },
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
    name: { ru: '✝️ Кельтский крест', uk: '✝️ Кельтський хрест', en: '✝️ Celtic Cross' },
    description: {
      ru: 'Самый глубокий расклад — 10 карт, полная картина',
      uk: 'Найглибший розклад — 10 карт, повна картина',
      en: 'The deepest spread — 10 cards, full picture',
    },
    icon: '✝️',
    image: '/ui/spreads/celtic_cross.webp',
    cardCount: 10,
    positions: [
      { ru: 'Центр — Тема', uk: 'Центр — Тема', en: 'Center — Theme' },
      { ru: 'Поперёк — Влияние', uk: 'Поперек — Вплив', en: 'Cross — Influence' },
      { ru: 'Ниже — Основание', uk: 'Нижче — Основа', en: 'Below — Foundation' },
      { ru: 'Выше — Цель', uk: 'Вище — Мета', en: 'Above — Goal' },
      { ru: 'Позади — Прошлое', uk: 'Позаду — Минуле', en: 'Behind — Past' },
      { ru: 'Впереди — Будущее', uk: 'Попереду — Майбутнє', en: 'Ahead — Future' },
      { ru: 'Ты сам', uk: 'Ти сам', en: 'Yourself' },
      { ru: 'Другие люди', uk: 'Інші люди', en: 'Other people' },
      { ru: 'Надежды и опасения', uk: 'Надії та побоювання', en: 'Hopes & Fears' },
      { ru: 'Итог — Корона', uk: 'Підсумок — Корона', en: 'Outcome — Crown' },
    ],
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
    name: { ru: '📅 Прогноз на неделю', uk: '📅 Прогноз на тиждень', en: '📅 Weekly Forecast' },
    description: {
      ru: '7 карт — по одной на каждый день',
      uk: '7 карт — по одній на кожен день',
      en: '7 cards — one for each day',
    },
    icon: '📅',
    image: '/ui/spreads/weekly.webp',
    cardCount: 7,
    positions: [
      { ru: 'Понедельник', uk: 'Понеділок', en: 'Monday' },
      { ru: 'Вторник', uk: 'Вівторок', en: 'Tuesday' },
      { ru: 'Среда', uk: 'Середа', en: 'Wednesday' },
      { ru: 'Четверг', uk: 'Четвер', en: 'Thursday' },
      { ru: 'Пятница', uk: "П'ятниця", en: 'Friday' },
      { ru: 'Суббота', uk: 'Субота', en: 'Saturday' },
      { ru: 'Воскресенье', uk: 'Неділя', en: 'Sunday' },
    ],
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'none',
  },
  {
    id: 'monthly',
    type: 'MONTHLY',
    category: 'tarot',
    name: { ru: '🗓️ Прогноз на месяц', uk: '🗓️ Прогноз на місяць', en: '🗓️ Monthly Forecast' },
    description: {
      ru: 'Общий расклад на предстоящий месяц',
      uk: 'Загальний розклад на наступний місяць',
      en: 'General reading for the coming month',
    },
    icon: '🗓️',
    image: '/ui/spreads/monthly.webp',
    cardCount: 4,
    positions: [
      { ru: 'Неделя 1', uk: 'Тиждень 1', en: 'Week 1' },
      { ru: 'Неделя 2', uk: 'Тиждень 2', en: 'Week 2' },
      { ru: 'Неделя 3', uk: 'Тиждень 3', en: 'Week 3' },
      { ru: 'Неделя 4', uk: 'Тиждень 4', en: 'Week 4' },
    ],
    freePerDay: 0,
    starsCost: 100,
    manaCost: 120,
    requiresInput: 'none',
  },
  {
    id: 'free_question',
    type: 'FREE_QUESTION',
    category: 'tarot',
    name: { ru: '❓ Свободный вопрос', uk: '❓ Вільне запитання', en: '❓ Free Question' },
    description: {
      ru: 'Задай любой вопрос — AI выберет лучший расклад',
      uk: 'Постав будь-яке запитання — AI обере найкращий розклад',
      en: 'Ask anything — AI picks the best spread',
    },
    icon: '❓',
    image: '/ui/spreads/free_question.webp',
    cardCount: 1,
    freePerDay: 0,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'question',
  },

  // ─── Esoteric / beyond tarot ───────────────────────────────────────────────
  {
    id: 'compatibility',
    type: 'COMPATIBILITY',
    category: 'esoteric',
    name: { ru: '💞 Совместимость', uk: '💞 Сумісність', en: '💞 Compatibility' },
    description: {
      ru: 'Проверь совместимость с партнёром — % и разбор',
      uk: 'Перевір сумісність з партнером — % та розбір',
      en: 'Check your compatibility — % score & analysis',
    },
    icon: '💞',
    image: '/ui/spreads/compatibility.webp',
    cardCount: 6,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'two_people',
  },
  {
    id: 'horoscope',
    type: 'HOROSCOPE',
    category: 'esoteric',
    name: { ru: '♈ Гороскоп', uk: '♈ Гороскоп', en: '♈ Horoscope' },
    description: {
      ru: 'Персональный гороскоп по знаку зодиака',
      uk: 'Персональний гороскоп за знаком зодіаку',
      en: 'Personal horoscope by zodiac sign',
    },
    icon: '♈',
    image: '/ui/spreads/horoscope.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 25,
    manaCost: 50,
    requiresInput: 'date',
  },
  {
    id: 'numerology',
    type: 'NUMEROLOGY',
    category: 'esoteric',
    name: { ru: '🔢 Нумерология', uk: '🔢 Нумерологія', en: '🔢 Numerology' },
    description: {
      ru: 'Анализ личности по дате рождения и имени',
      uk: 'Аналіз особистості за датою народження та ім\'ям',
      en: 'Personality analysis by birth date and name',
    },
    icon: '🔢',
    image: '/ui/spreads/numerology.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 75,
    manaCost: 80,
    requiresInput: 'date',
  },
  {
    id: 'runes',
    type: 'RUNES',
    category: 'esoteric',
    name: { ru: 'ᚱ Руны', uk: 'ᚱ Руни', en: 'ᚱ Runes' },
    description: {
      ru: 'Скандинавские руны — древнее гадание',
      uk: 'Скандинавські руни — давнє ворожіння',
      en: 'Norse runes — ancient divination',
    },
    icon: 'ᚱ',
    image: '/ui/spreads/runes.webp',
    cardCount: 3,
    freePerDay: 0,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'question',
  },
  {
    id: 'dream',
    type: 'DREAM',
    category: 'esoteric',
    name: { ru: '💤 Толкование снов', uk: '💤 Тлумачення снів', en: '💤 Dream Interpretation' },
    description: {
      ru: 'Опиши свой сон — AI разберёт символы',
      uk: 'Опиши свій сон — AI розбере символи',
      en: 'Describe your dream — AI decodes the symbols',
    },
    icon: '💤',
    image: '/ui/spreads/dream.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 50,
    manaCost: 50,
    requiresInput: 'dream_text',
  },
  {
    id: 'angel_numbers',
    type: 'ANGEL_NUMBERS',
    category: 'esoteric',
    name: { ru: '👼 Ангельские числа', uk: '👼 Ангельські числа', en: '👼 Angel Numbers' },
    description: {
      ru: 'Видишь число повсюду? Узнай что оно значит',
      uk: 'Бачиш число всюди? Дізнайся що воно означає',
      en: 'Keep seeing a number? Find out what it means',
    },
    icon: '👼',
    image: '/ui/spreads/angel_numbers.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 0,
    manaCost: 50,
    requiresInput: 'number',
  },
  {
    id: 'moon_phase',
    type: 'MOON_PHASE',
    category: 'esoteric',
    name: { ru: '🌙 Фазы луны', uk: '🌙 Фази місяця', en: '🌙 Moon Phases' },
    description: {
      ru: 'Рекомендации на сегодня по лунному календарю',
      uk: 'Рекомендації на сьогодні за місячним календарем',
      en: 'Today\'s guidance based on the lunar calendar',
    },
    icon: '🌙',
    image: '/ui/spreads/moon_phase.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 0,
    manaCost: 50,
    requiresInput: 'none',
  },
  {
    id: 'past_lives',
    type: 'PAST_LIVES',
    category: 'esoteric',
    name: { ru: '🕰️ Прошлые жизни', uk: '🕰️ Минулі життя', en: '🕰️ Past Lives' },
    description: {
      ru: 'Кем ты был в прошлой жизни? AI расскажет',
      uk: 'Ким ти був у минулому житті? AI розкаже',
      en: 'Who were you in a past life? AI reveals all',
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
    category: 'esoteric',
    name: { ru: '🧘 Чакры', uk: '🧘 Чакри', en: '🧘 Chakras' },
    description: {
      ru: 'Какая чакра заблокирована? Советы по раскрытию',
      uk: 'Яка чакра заблокована? Поради щодо розкриття',
      en: 'Which chakra is blocked? Tips to unlock it',
    },
    icon: '🧘',
    image: '/ui/spreads/chakra.webp',
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
    name: { ru: '🤚 Хиромантия', uk: '🤚 Хіромантія', en: '🤚 Palm Reading' },
    description: {
      ru: 'Фото ладони — AI прочитает линии',
      uk: 'Фото долоні — AI прочитає лінії',
      en: 'Photo of your palm — AI reads the lines',
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
    name: { ru: '✨ Аура по фото', uk: '✨ Аура за фото', en: '✨ Aura Reading' },
    description: {
      ru: 'Селфи → цвет ауры + толкование',
      uk: 'Селфі → колір аури + інтерпретація',
      en: 'Selfie → aura color + interpretation',
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
    name: { ru: '🧠 Прочитай меня', uk: '🧠 Прочитай мене', en: '🧠 Read Me' },
    description: {
      ru: 'AI составит твой психологический портрет',
      uk: 'AI складе твій психологічний портрет',
      en: 'AI creates your psychological portrait',
    },
    icon: '🧠',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 100,
    requiresInput: 'question',
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
