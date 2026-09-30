/**
 * All spread types configuration
 * Defines card count, positions, pricing, and free tier limits
 */

export type SpreadCategory = 'tarot' | 'esoteric' | 'personal';
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
  requiresInput: 'none' | 'question' | 'name' | 'date' | 'number' | 'dream_text' | 'two_people' | 'natal_data' | 'two_options' | 'portrait';
  requiresSubscription?: 'BASIC' | 'PREMIUM' | 'VIP';
  isNew?: boolean;
  isPopular?: boolean;
  /** Limited spread: open only around the new / full moon (lib/moon moonSpreadWindow) */
  moonEvent?: 'new' | 'full';
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
    manaCost: 77,
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
    manaCost: 111,
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
    manaCost: 111,
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
    manaCost: 222,
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
    manaCost: 333,
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
    manaCost: 555,
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
    manaCost: 222,
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
    manaCost: 333,
    requiresInput: 'none',
  },
  {
    id: 'free_question',
    type: 'FREE_QUESTION',
    category: 'tarot',
    name: { ru: '❓ Свободный вопрос', uk: '❓ Вільне запитання', en: '❓ Free Question' },
    description: {
      ru: 'Задай любой вопрос — карты ответят прямо',
      uk: 'Постав будь-яке запитання — карти відповідять прямо',
      en: 'Ask anything — the cards answer straight',
    },
    icon: '❓',
    image: '/ui/spreads/free_question.webp',
    cardCount: 1,
    freePerDay: 0,
    starsCost: 50,
    manaCost: 77,
    requiresInput: 'question',
  },

  // ─── Esoteric / beyond tarot ───────────────────────────────────────────────
  {
    id: 'natal_chart',
    type: 'NATAL_CHART',
    category: 'esoteric',
    name: { ru: '🪐 Натальная карта', uk: '🪐 Натальна карта', en: '🪐 Natal Chart' },
    description: {
      ru: 'Полный разбор карты рождения — планеты, дома, аспекты',
      uk: 'Повний розбір карти народження — планети, доми, аспекти',
      en: 'Full birth chart analysis — planets, houses, aspects',
    },
    icon: '🪐',
    image: '/ui/spreads/natal_chart.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 500,
    manaCost: 1111,
    requiresInput: 'natal_data',
    isNew: true,
    isPopular: true,
  },
  {
    id: 'destiny_matrix',
    type: 'DESTINY_MATRIX',
    category: 'esoteric',
    name: { ru: '🔯 Матрица судьбы', uk: '🔯 Матриця долі', en: '🔯 Destiny Matrix' },
    description: {
      ru: 'Разбор по дате рождения — предназначение, деньги, отношения, род',
      uk: 'Розбір за датою народження — призначення, гроші, стосунки, рід',
      en: 'Birth date chart — purpose, money, relationships, ancestry',
    },
    icon: '🔯',
    image: '/ui/spreads/destiny_matrix.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 300,
    manaCost: 777,
    requiresInput: 'date',
    isNew: true,
    isPopular: true,
  },
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
    manaCost: 111,
    requiresInput: 'two_people',
  },
  {
    id: 'horoscope',
    type: 'HOROSCOPE',
    category: 'esoteric',
    name: { ru: '♈ Гороскоп на сегодня', uk: '♈ Гороскоп на сьогодні', en: '♈ Horoscope Today' },
    description: {
      ru: 'Подробный персональный гороскоп на сегодняшний день',
      uk: 'Детальний персональний гороскоп на сьогоднішній день',
      en: 'Detailed personal horoscope for today',
    },
    icon: '♈',
    image: '/ui/spreads/horoscope.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 25,
    manaCost: 111,
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
    manaCost: 333,
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
    manaCost: 111,
    requiresInput: 'question',
  },
  {
    id: 'dream',
    type: 'DREAM',
    category: 'esoteric',
    name: { ru: '💤 Толкование снов', uk: '💤 Тлумачення снів', en: '💤 Dream Interpretation' },
    description: {
      ru: 'Опиши свой сон — Оракул разберёт его символы',
      uk: 'Опиши свій сон — Оракул розбере його символи',
      en: 'Describe your dream — the Oracle decodes its symbols',
    },
    icon: '💤',
    image: '/ui/spreads/dream.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 50,
    manaCost: 111,
    requiresInput: 'dream_text',
  },
  {
    id: 'angel_numbers',
    type: 'ANGEL_NUMBERS',
    category: 'esoteric',
    name: { ru: '👼 Ангельские числа', uk: '👼 Ангельські числа', en: '👼 Angel Numbers' },
    description: {
      ru: 'Видишь число повсюду? Узнай, что оно значит',
      uk: 'Бачиш число всюди? Дізнайся, що воно означає',
      en: 'Keep seeing a number? Find out what it means',
    },
    icon: '👼',
    image: '/ui/spreads/angel_numbers.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 0,
    manaCost: 333,
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
    manaCost: 222,
    requiresInput: 'none',
  },
  {
    id: 'past_lives',
    type: 'PAST_LIVES',
    category: 'esoteric',
    name: { ru: '🕰️ Прошлые жизни', uk: '🕰️ Минулі життя', en: '🕰️ Past Lives' },
    description: {
      ru: 'Кем ты был в прошлой жизни? Оракул расскажет',
      uk: 'Ким ти був у минулому житті? Оракул розкаже',
      en: 'Who were you in a past life? The Oracle reveals it',
    },
    icon: '🕰️',
    image: '/ui/spreads/past_lives.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 222,
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
    manaCost: 222,
    requiresInput: 'none',
  },

  // ─── Tarot: added 2026-10 ────────────────────────────────────────────────
  {
    id: 'love_future',
    type: 'LOVE_FUTURE',
    category: 'tarot',
    name: { ru: '💘 Встречу ли я любовь', uk: '💘 Чи зустріну я кохання', en: '💘 Will I meet love' },
    description: {
      ru: 'Каким будет твой человек и что мешает встрече',
      uk: 'Якою буде твоя людина і що заважає зустрічі',
      en: 'Who your person will be and what keeps you apart',
    },
    icon: '💘',
    image: '/ui/spreads/love_future.webp',
    cardCount: 4,
    positions: [
      { ru: 'Ты сейчас в любви', uk: 'Ти зараз у коханні', en: 'You in love right now' },
      { ru: 'Что мешает встрече', uk: 'Що заважає зустрічі', en: 'What blocks the meeting' },
      { ru: 'Каким будет человек', uk: 'Якою буде людина', en: 'Who they will be' },
      { ru: 'Где и когда ждать', uk: 'Де і коли чекати', en: 'Where and when' },
    ],
    freePerDay: 0,
    starsCost: 75,
    manaCost: 222,
    requiresInput: 'none',
    isNew: true,
  },
  {
    id: 'ex_return',
    type: 'EX_RETURN',
    category: 'tarot',
    name: { ru: '🔁 Вернётся ли бывший', uk: '🔁 Чи повернеться колишній', en: '🔁 Will my ex come back' },
    description: {
      ru: 'Что он чувствует сейчас и есть ли у вас шанс',
      uk: 'Що він відчуває зараз і чи є у вас шанс',
      en: 'What they feel now and whether you have a chance',
    },
    icon: '🔁',
    image: '/ui/spreads/ex_return.webp',
    cardCount: 5,
    positions: [
      { ru: 'Его чувства сейчас', uk: 'Його почуття зараз', en: 'Their feelings now' },
      { ru: 'Настоящая причина расставания', uk: 'Справжня причина розставання', en: 'The real reason you split' },
      { ru: 'Думает ли о возвращении', uk: 'Чи думає про повернення', en: 'Are they thinking of returning' },
      { ru: 'Если вы сойдётесь', uk: 'Якщо ви зійдетеся', en: 'If you get back together' },
      { ru: 'Совет тебе', uk: 'Порада тобі', en: 'Advice for you' },
    ],
    freePerDay: 0,
    starsCost: 100,
    manaCost: 333,
    requiresInput: 'name',
    isNew: true,
  },
  {
    id: 'two_paths',
    type: 'TWO_PATHS',
    category: 'tarot',
    name: { ru: '🔀 Выбор из двух путей', uk: '🔀 Вибір із двох шляхів', en: '🔀 Two paths' },
    description: {
      ru: 'Что будет, если выбрать одно или другое',
      uk: 'Що буде, якщо обрати одне чи інше',
      en: 'What happens if you choose one or the other',
    },
    icon: '🔀',
    image: '/ui/spreads/two_paths.webp',
    cardCount: 5,
    positions: [
      { ru: 'Суть выбора', uk: 'Суть вибору', en: 'The heart of the choice' },
      { ru: 'Путь А: что даст', uk: 'Шлях А: що дасть', en: 'Path A: what it gives' },
      { ru: 'Путь А: к чему приведёт', uk: 'Шлях А: до чого приведе', en: 'Path A: where it leads' },
      { ru: 'Путь Б: что даст', uk: 'Шлях Б: що дасть', en: 'Path B: what it gives' },
      { ru: 'Путь Б: к чему приведёт', uk: 'Шлях Б: до чого приведе', en: 'Path B: where it leads' },
    ],
    freePerDay: 0,
    starsCost: 75,
    manaCost: 222,
    requiresInput: 'two_options',
    isNew: true,
  },
  {
    id: 'card_advice',
    type: 'CARD_ADVICE',
    category: 'tarot',
    name: { ru: '🕯️ Совет карт', uk: '🕯️ Порада карт', en: '🕯️ Cards\' advice' },
    description: {
      ru: 'Не прогноз, а подсказка: что делать прямо сейчас',
      uk: 'Не прогноз, а підказка: що робити просто зараз',
      en: 'Not a forecast but a hint: what to do right now',
    },
    icon: '🕯️',
    image: '/ui/spreads/card_advice.webp',
    cardCount: 1,
    freePerDay: 0,
    starsCost: 25,
    manaCost: 77,
    requiresInput: 'question',
    isNew: true,
  },
  {
    id: 'year_ahead',
    type: 'YEAR_AHEAD',
    category: 'tarot',
    name: { ru: '🎂 Год вперёд', uk: '🎂 Рік уперед', en: '🎂 Year ahead' },
    description: {
      ru: 'Карта года и по карте на каждый из 12 месяцев',
      uk: 'Карта року і по карті на кожен із 12 місяців',
      en: 'A card for the year and one for each of 12 months',
    },
    icon: '🎂',
    image: '/ui/spreads/year_ahead.webp',
    cardCount: 13,
    freePerDay: 0,
    starsCost: 300,
    manaCost: 777,
    requiresInput: 'none',
    isNew: true,
  },

  // ─── Limited: only around the new / full moon ────────────────────────────
  {
    id: 'new_moon',
    type: 'NEW_MOON',
    category: 'tarot',
    name: { ru: '🌑 Расклад новолуния', uk: '🌑 Розклад молодика', en: '🌑 New moon spread' },
    description: {
      ru: 'Что отпустить и что посеять в новый лунный цикл',
      uk: 'Що відпустити і що посіяти в новий місячний цикл',
      en: 'What to release and what to plant for the new cycle',
    },
    icon: '🌑',
    image: '/ui/spreads/new_moon.webp',
    cardCount: 3,
    positions: [
      { ru: 'Что отпустить', uk: 'Що відпустити', en: 'What to release' },
      { ru: 'Что посеять', uk: 'Що посіяти', en: 'What to plant' },
      { ru: 'Первый шаг цикла', uk: 'Перший крок циклу', en: 'First step of the cycle' },
    ],
    freePerDay: 0,
    starsCost: 50,
    manaCost: 111,
    requiresInput: 'none',
    moonEvent: 'new',
  },
  {
    id: 'full_moon',
    type: 'FULL_MOON',
    category: 'tarot',
    name: { ru: '🌕 Расклад полнолуния', uk: '🌕 Розклад повні', en: '🌕 Full moon spread' },
    description: {
      ru: 'Что проявилось, что на пике и с чем пора проститься',
      uk: 'Що проявилося, що на піку і з чим час попрощатися',
      en: 'What surfaced, what peaked and what to let go',
    },
    icon: '🌕',
    image: '/ui/spreads/full_moon.webp',
    cardCount: 4,
    positions: [
      { ru: 'Что проявилось', uk: 'Що проявилося', en: 'What surfaced' },
      { ru: 'Что на пике', uk: 'Що на піку', en: 'What has peaked' },
      { ru: 'С чем проститься', uk: 'З чим попрощатися', en: 'What to let go' },
      { ru: 'Урок полнолуния', uk: 'Урок повні', en: 'The full moon lesson' },
    ],
    freePerDay: 0,
    starsCost: 50,
    manaCost: 111,
    requiresInput: 'none',
    moonEvent: 'full',
  },

  // ─── Esoteric: «Прочитай меня» (no cards, a questionnaire) ───────────────
  {
    id: 'psych_portrait',
    type: 'PSYCH_PORTRAIT',
    category: 'esoteric',
    name: { ru: '🪞 Прочитай меня', uk: '🪞 Прочитай мене', en: '🪞 Read me' },
    description: {
      ru: 'Восемь коротких вопросов — и Оракул расскажет, какой ты на самом деле',
      uk: 'Вісім коротких питань — і Оракул розповість, який ти насправді',
      en: 'Eight short questions and the Oracle tells you who you really are',
    },
    icon: '🪞',
    image: '/ui/spreads/psych_portrait.webp',
    cardCount: 0,
    freePerDay: 0,
    starsCost: 100,
    manaCost: 333,
    requiresInput: 'portrait',
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

// ─── Economy rules shared by server access checks and the UI ───────────────

/** Large reports: premium covers one of them per PREMIUM_BIG_REPORT_DAYS */
export const BIG_REPORT_IDS = ['natal_chart', 'destiny_matrix'];
export const PREMIUM_BIG_REPORT_DAYS = 30;

/** A new user's first paid reading is free when it costs up to this much */
export const FIRST_FREE_MAX_COST = 333;

export function isBigReport(spread: Pick<SpreadConfig, 'id'>): boolean {
  return BIG_REPORT_IDS.includes(spread.id);
}

export function firstFreeEligible(spread: SpreadConfig): boolean {
  return spread.manaCost > 0 && spread.manaCost <= FIRST_FREE_MAX_COST && !isBigReport(spread) && !spread.requiresSubscription;
}
