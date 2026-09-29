/**
 * Texts for the moon widget: 8 phases, the Moon in 12 signs, and the
 * personal line (how today's Moon sign stands to the user's sun sign).
 */

import type { PhaseKey } from '@/lib/moon';

type Locale = 'ru' | 'uk' | 'en';
type T = Record<Locale, string>;

export interface PhaseText {
  name: T;
  vibe: T;
  long: T;
  /** Spread that fits this phase best (id from data/spreads) */
  spread: string;
}

export const PHASE_TEXT: Record<PhaseKey, PhaseText> = {
  new: {
    name: { ru: 'Новолуние', uk: 'Молодик', en: 'New Moon' },
    vibe: {
      ru: 'Чистый лист. Загадывай, но конкретно',
      uk: 'Чистий аркуш. Загадуй, але конкретно',
      en: 'A blank page. Make a wish, and be specific',
    },
    long: {
      ru: 'Луна обнуляется, и ты вместе с ней. Лучшее время намечать планы и формулировать желания. Сил пока немного, так что без подвигов: задумать сейчас важнее, чем сделать.',
      uk: 'Місяць обнуляється, і ти разом із ним. Найкращий час намічати плани й формулювати бажання. Сил поки небагато, тож без подвигів: задумати зараз важливіше, ніж зробити.',
      en: 'The Moon resets, and so do you. Best time to set intentions and sketch plans. Energy is low, so skip the heroics: deciding matters more than doing right now.',
    },
    spread: 'monthly',
  },
  waxing_crescent: {
    name: { ru: 'Растущий серп', uk: 'Молодий серп', en: 'Waxing Crescent' },
    vibe: {
      ru: 'Энергия прибывает. Пора делать первый шаг',
      uk: 'Енергія прибуває. Час зробити перший крок',
      en: 'Energy is building. Take the first step',
    },
    long: {
      ru: 'Задуманное в новолуние просит действий. Начинай с малого: звонок, заявка, первое сообщение. Всё, что растёт сейчас, растёт вместе с Луной.',
      uk: 'Задумане на молодик просить дій. Починай з малого: дзвінок, заявка, перше повідомлення. Усе, що росте зараз, росте разом із Місяцем.',
      en: 'Whatever you planned at the new moon now wants action. Start small: a call, an application, a first message. Anything that grows now grows with the Moon.',
    },
    spread: 'free_question',
  },
  first_quarter: {
    name: { ru: 'Первая четверть', uk: 'Перша чверть', en: 'First Quarter' },
    vibe: {
      ru: 'Время решений. Сомнения оставь на потом',
      uk: 'Час рішень. Сумніви залиш на потім',
      en: 'Time to decide. Save the doubts for later',
    },
    long: {
      ru: 'Первые препятствия и первые развилки. Луна подталкивает выбирать, а не взвешивать до бесконечности. Решение, принятое сейчас, обычно оказывается верным.',
      uk: 'Перші перешкоди й перші розвилки. Місяць підштовхує обирати, а не зважувати без кінця. Рішення, ухвалене зараз, зазвичай виявляється правильним.',
      en: 'First obstacles, first crossroads. The Moon pushes you to choose instead of weighing things forever. A decision made now usually turns out right.',
    },
    spread: 'yes_no',
  },
  waxing_gibbous: {
    name: { ru: 'Растущая Луна', uk: 'Зростаючий Місяць', en: 'Waxing Gibbous' },
    vibe: {
      ru: 'Доводи до ума начатое',
      uk: 'Доводь до ладу розпочате',
      en: 'Polish what you have started',
    },
    long: {
      ru: 'Сил хватает на последний рывок. Хорошо дорабатывать, шлифовать и договариваться. Эмоции тоже растут, поэтому на резкие слова отвечай после паузы.',
      uk: 'Сил вистачає на останній ривок. Добре доопрацьовувати, шліфувати й домовлятися. Емоції теж ростуть, тож на різкі слова відповідай після паузи.',
      en: 'Enough fuel for a final push. Good for refining, fine-tuning and negotiating. Emotions are rising too, so answer sharp words after a pause.',
    },
    spread: 'weekly',
  },
  full: {
    name: { ru: 'Полнолуние', uk: 'Повня', en: 'Full Moon' },
    vibe: {
      ru: 'Пик эмоций. Всё тайное просится наружу',
      uk: 'Пік емоцій. Усе таємне проситься назовні',
      en: 'Emotions peak. Secrets want out',
    },
    long: {
      ru: 'Эмоции на максимуме, интуиция тоже. Лучшее время для раскладов на отношения и честных разговоров. Худшее время выяснять, кто первый начал.',
      uk: 'Емоції на максимумі, інтуїція теж. Найкращий час для розкладів на стосунки й чесних розмов. Найгірший час з’ясовувати, хто перший почав.',
      en: 'Emotions and intuition are at their peak. Best time for relationship readings and honest talks. Worst time to argue about who started it.',
    },
    spread: 'relationship',
  },
  waning_gibbous: {
    name: { ru: 'Убывающая Луна', uk: 'Спадний Місяць', en: 'Waning Gibbous' },
    vibe: {
      ru: 'Время подводить итоги и благодарить',
      uk: 'Час підбивати підсумки й дякувати',
      en: 'Time to take stock and give thanks',
    },
    long: {
      ru: 'Волна схлынула, и видно, что осталось на берегу. Хорошо анализировать, делиться опытом, отдавать долги. Не лучшее время для новых начинаний.',
      uk: 'Хвиля відкотилася, і видно, що лишилося на березі. Добре аналізувати, ділитися досвідом, віддавати борги. Не найкращий час для нових починань.',
      en: 'The wave has rolled back and you can see what is left on the shore. Good for analysis, sharing experience and paying debts. Not the best time to start something new.',
    },
    spread: 'what_they_think',
  },
  last_quarter: {
    name: { ru: 'Последняя четверть', uk: 'Остання чверть', en: 'Last Quarter' },
    vibe: {
      ru: 'Отпускай то, что держит без пользы',
      uk: 'Відпускай те, що тримає без користі',
      en: 'Let go of what holds you for nothing',
    },
    long: {
      ru: 'Луна расчищает пространство. Разбери шкаф, чаты и список контактов. Всё, что уходит сейчас, уходит легко и не возвращается.',
      uk: 'Місяць розчищає простір. Розбери шафу, чати й список контактів. Усе, що йде зараз, іде легко й не повертається.',
      en: 'The Moon is clearing space. Sort out the closet, the chats and the contact list. What leaves now leaves easily and does not come back.',
    },
    spread: 'past_lives',
  },
  waning_crescent: {
    name: { ru: 'Убывающий серп', uk: 'Старий серп', en: 'Waning Crescent' },
    vibe: {
      ru: 'Отдых и тишина перед новым циклом',
      uk: 'Відпочинок і тиша перед новим циклом',
      en: 'Rest and quiet before a new cycle',
    },
    long: {
      ru: 'Силы на исходе, и это нормально. Высыпайся, прислушивайся к снам, не принимай судьбоносных решений. Скоро новолуние, и всё начнётся заново.',
      uk: 'Сили на межі, і це нормально. Висипайся, прислухайся до снів, не ухвалюй доленосних рішень. Скоро молодик, і все почнеться знову.',
      en: 'Energy is running low, and that is fine. Sleep well, listen to your dreams, avoid life-changing decisions. The new moon is close and everything starts again.',
    },
    spread: 'dream',
  },
};

export interface SignText {
  mood: T;
  good: T;
  avoid: T;
}

/** The Moon passing through each sign (index 0 = Aries) */
export const MOON_SIGN_TEXT: SignText[] = [
  {
    mood: { ru: 'Импульсивный день: сначала делают, потом думают', uk: 'Імпульсивний день: спершу роблять, потім думають', en: 'An impulsive day: act first, think later' },
    good: { ru: 'начинать новое, спорт, быстрые решения', uk: 'починати нове, спорт, швидкі рішення', en: 'fresh starts, sport, quick decisions' },
    avoid: { ru: 'споры и покупки на эмоциях', uk: 'суперечки й покупки на емоціях', en: 'arguments and impulse buys' },
  },
  {
    mood: { ru: 'Спокойный земной день. Хочется комфорта и вкусного', uk: 'Спокійний земний день. Хочеться комфорту й смачного', en: 'A calm, earthy day. Comfort and good food call' },
    good: { ru: 'деньги, красота, дела по дому', uk: 'гроші, краса, справи вдома', en: 'money, beauty, home chores' },
    avoid: { ru: 'резкие перемены и новые диеты', uk: 'різкі зміни й нові дієти', en: 'sudden changes and new diets' },
  },
  {
    mood: { ru: 'Много слов, сообщений и новостей', uk: 'Багато слів, повідомлень і новин', en: 'Lots of words, messages and news' },
    good: { ru: 'переговоры, учёба, знакомства', uk: 'перемовини, навчання, знайомства', en: 'talks, learning, new people' },
    avoid: { ru: 'сплетни и обещания впопыхах', uk: 'плітки й поспішні обіцянки', en: 'gossip and rushed promises' },
  },
  {
    mood: { ru: 'Чувствительный день, тянет домой и к своим', uk: 'Чутливий день, тягне додому й до своїх', en: 'A tender day that pulls you home' },
    good: { ru: 'семья, уют, разговоры по душам', uk: 'родина, затишок, розмови по душах', en: 'family, cosiness, heart-to-hearts' },
    avoid: { ru: 'обиды и выяснение отношений', uk: 'образи й з’ясування стосунків', en: 'grudges and relationship showdowns' },
  },
  {
    mood: { ru: 'Хочется блистать и собирать комплименты', uk: 'Хочеться сяяти й збирати компліменти', en: 'You want to shine and collect compliments' },
    good: { ru: 'свидания, творчество, выход в свет', uk: 'побачення, творчість, вихід у світ', en: 'dates, creativity, going out' },
    avoid: { ru: 'гордыню и траты напоказ', uk: 'гординю й витрати напоказ', en: 'pride and showing off with money' },
  },
  {
    mood: { ru: 'День порядка и мелочей', uk: 'День порядку й дрібниць', en: 'A day of order and details' },
    good: { ru: 'уборка, здоровье, документы', uk: 'прибирання, здоров’я, документи', en: 'tidying, health, paperwork' },
    avoid: { ru: 'критику близких и перфекционизм', uk: 'критику близьких і перфекціонізм', en: 'criticising loved ones, perfectionism' },
  },
  {
    mood: { ru: 'Тянет к красоте и гармонии', uk: 'Тягне до краси й гармонії', en: 'Beauty and harmony are calling' },
    good: { ru: 'примирения, свидания, красота', uk: 'примирення, побачення, краса', en: 'making up, dates, beauty' },
    avoid: { ru: 'сложный выбор и конфликты', uk: 'складний вибір і конфлікти', en: 'hard choices and conflicts' },
  },
  {
    mood: { ru: 'Эмоции глубокие, интуиция острая', uk: 'Емоції глибокі, інтуїція гостра', en: 'Deep emotions, sharp intuition' },
    good: { ru: 'расклады, психология, тайные дела', uk: 'розклади, психологія, таємні справи', en: 'readings, psychology, secret plans' },
    avoid: { ru: 'ревность и проверку чужого телефона', uk: 'ревнощі й перевірку чужого телефона', en: 'jealousy and checking someone’s phone' },
  },
  {
    mood: { ru: 'Оптимизм и жажда приключений', uk: 'Оптимізм і жага пригод', en: 'Optimism and a thirst for adventure' },
    good: { ru: 'поездки, учёба, планы на будущее', uk: 'поїздки, навчання, плани на майбутнє', en: 'trips, learning, future plans' },
    avoid: { ru: 'обещать больше, чем сможешь', uk: 'обіцяти більше, ніж зможеш', en: 'promising more than you can deliver' },
  },
  {
    mood: { ru: 'Серьёзный деловой день', uk: 'Серйозний діловий день', en: 'A serious, businesslike day' },
    good: { ru: 'карьера, планы, важные встречи', uk: 'кар’єра, плани, важливі зустрічі', en: 'career, planning, important meetings' },
    avoid: { ru: 'легкомыслие и опоздания', uk: 'легковажність і запізнення', en: 'carelessness and being late' },
  },
  {
    mood: { ru: 'Неожиданности и свежие идеи', uk: 'Несподіванки й свіжі ідеї', en: 'Surprises and fresh ideas' },
    good: { ru: 'друзья, эксперименты, новое', uk: 'друзі, експерименти, нове', en: 'friends, experiments, anything new' },
    avoid: { ru: 'жёсткие планы и споры с системой', uk: 'жорсткі плани й суперечки із системою', en: 'rigid plans and fighting the system' },
  },
  {
    mood: { ru: 'Мечтательный, туманный день', uk: 'Мрійливий, туманний день', en: 'A dreamy, misty day' },
    good: { ru: 'интуиция, творчество, сны', uk: 'інтуїція, творчість, сни', en: 'intuition, creativity, dreams' },
    avoid: { ru: 'подписывать важное и верить на слово', uk: 'підписувати важливе й вірити на слово', en: 'signing anything big, taking words on trust' },
  },
];

/**
 * Personal line by the angle between today's Moon sign and the user's sign.
 * Key = distance in signs (0..6, symmetric).
 */
export const PERSONAL_TEXT: Record<number, T> = {
  0: {
    ru: 'Луна в твоём знаке. Эмоции на максимуме, интуиция тоже. Хороший день спросить карты о главном.',
    uk: 'Місяць у твоєму знаку. Емоції на максимумі, інтуїція теж. Добрий день запитати карти про головне.',
    en: 'The Moon is in your sign. Emotions and intuition run high. A good day to ask the cards about what matters.',
  },
  1: {
    ru: 'Луна у соседей. День ровный, без сюрпризов, но и без магии. Займись делами.',
    uk: 'Місяць у сусідів. День рівний, без сюрпризів, але й без магії. Займися справами.',
    en: 'The Moon is next door. An even day, no surprises, no magic either. Get things done.',
  },
  2: {
    ru: 'Луна тебе подмигивает. Легко договариваться и знакомиться, пользуйся.',
    uk: 'Місяць тобі підморгує. Легко домовлятися й знайомитися, користуйся.',
    en: 'The Moon is winking at you. Deals and new people come easy, use it.',
  },
  3: {
    ru: 'Луна давит на твой знак. Не начинай ссор, даже если очень хочется.',
    uk: 'Місяць тисне на твій знак. Не починай сварок, навіть якщо дуже хочеться.',
    en: 'The Moon is pressing on your sign. Don’t start a fight, even if you really want to.',
  },
  4: {
    ru: 'Луна в твоей стихии. Всё складывается само, главное не мешать.',
    uk: 'Місяць у твоїй стихії. Усе складається саме, головне не заважати.',
    en: 'The Moon is in your element. Things fall into place, just don’t get in the way.',
  },
  5: {
    ru: 'Луна не совпадает с тобой по ритму. Меньше планов, больше гибкости.',
    uk: 'Місяць не збігається з тобою в ритмі. Менше планів, більше гнучкості.',
    en: 'The Moon is out of sync with you. Fewer plans, more flexibility.',
  },
  6: {
    ru: 'Луна напротив твоего знака. Другие будут требовать внимания, выбери, кому его дать.',
    uk: 'Місяць навпроти твого знака. Інші вимагатимуть уваги, обери, кому її дати.',
    en: 'The Moon is opposite your sign. Others will want your attention, choose who gets it.',
  },
};

export function personalKey(moonSign: number, userSign: number): number {
  const d = (moonSign - userSign + 12) % 12;
  return d > 6 ? 12 - d : d;
}

export const MOON_UI = {
  today: { ru: 'Луна сегодня', uk: 'Місяць сьогодні', en: 'Moon today' },
  moonIn: { ru: 'Луна в', uk: 'Місяць у', en: 'Moon in' },
  lit: { ru: 'освещена', uk: 'освітлений', en: 'illuminated' },
  lunarDay: { ru: '-й лунный день', uk: '-й місячний день', en: '' },
  lunarDayEn: 'Lunar day ',
  fullIn: { ru: 'Полнолуние через', uk: 'Повня через', en: 'Full moon in' },
  newIn: { ru: 'Новолуние через', uk: 'Молодик через', en: 'New moon in' },
  fullToday: { ru: 'Полнолуние сегодня', uk: 'Повня сьогодні', en: 'Full moon today' },
  newToday: { ru: 'Новолуние сегодня', uk: 'Молодик сьогодні', en: 'New moon today' },
  good: { ru: 'Благоприятно', uk: 'Сприятливо', en: 'Good for' },
  avoid: { ru: 'Лучше отложить', uk: 'Краще відкласти', en: 'Better avoid' },
  spread: { ru: 'Для раскладов', uk: 'Для розкладів', en: 'Best reading' },
  forYou: { ru: 'Для тебя', uk: 'Для тебе', en: 'For you' },
  askTitle: {
    ru: 'Луна может говорить лично с тобой',
    uk: 'Місяць може говорити особисто з тобою',
    en: 'The Moon can speak to you personally',
  },
  askText: {
    ru: 'Укажи дату рождения, и каждый день здесь будет прогноз для твоего знака',
    uk: 'Вкажи дату народження, і щодня тут буде прогноз для твого знака',
    en: 'Add your birth date and get a daily forecast for your sign right here',
  },
  askButton: { ru: 'Указать дату', uk: 'Вказати дату', en: 'Add birth date' },
  save: { ru: 'Сохранить', uk: 'Зберегти', en: 'Save' },
  cancel: { ru: 'Отмена', uk: 'Скасувати', en: 'Cancel' },
  saveError: {
    ru: 'Не получилось сохранить, попробуй ещё раз',
    uk: 'Не вдалося зберегти, спробуй ще раз',
    en: 'Could not save, please try again',
  },
  more: { ru: 'Подробнее', uk: 'Детальніше', en: 'Details' },
  change: { ru: 'изменить дату', uk: 'змінити дату', en: 'change date' },
  dayStarted: { ru: 'Лунный день начался в', uk: 'Місячний день почався о', en: 'Lunar day began at' },
  kyiv: { ru: 'по Киеву', uk: 'за Києвом', en: 'Kyiv time' },
  signChange: { ru: 'Луна перейдёт в', uk: 'Місяць перейде в', en: 'Moon enters' },
  nextFull: { ru: 'Ближайшее полнолуние', uk: 'Найближча повня', en: 'Next full moon' },
  nextNew: { ru: 'Ближайшее новолуние', uk: 'Найближчий молодик', en: 'Next new moon' },
  moonReading: { ru: 'Лунный расклад на сегодня', uk: 'Місячний розклад на сьогодні', en: 'Today’s moon reading' },
  close: { ru: 'Закрыть', uk: 'Закрити', en: 'Close' },
};
