/**
 * Full 78-card Tarot deck data
 * 22 Major Arcana + 56 Minor Arcana
 */

export interface TarotCard {
  id: number;
  name: { ru: string; uk: string };
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  image: string; // path to card image
  keywords: { ru: string[]; uk: string[] };
  reversedKeywords: { ru: string[]; uk: string[] };
}

// ─── Major Arcana (0-21) ─────────────────────────────────────────────────────

export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0,
    name: { ru: 'Шут', uk: 'Блазень' },
    arcana: 'major',
    image: '/cards/major/00-fool.webp',
    keywords: {
      ru: ['новое начало', 'свобода', 'спонтанность', 'вера'],
      uk: ['новий початок', 'свобода', 'спонтанність', 'віра'],
    },
    reversedKeywords: {
      ru: ['безрассудство', 'риск', 'наивность'],
      uk: ['безрозсудність', 'ризик', 'наївність'],
    },
  },
  {
    id: 1,
    name: { ru: 'Маг', uk: 'Маг' },
    arcana: 'major',
    image: '/cards/major/01-magician.webp',
    keywords: {
      ru: ['сила воли', 'мастерство', 'ресурсы', 'действие'],
      uk: ['сила волі', 'майстерність', 'ресурси', 'дія'],
    },
    reversedKeywords: {
      ru: ['обман', 'манипуляция', 'неиспользованный потенциал'],
      uk: ['обман', 'маніпуляція', 'невикористаний потенціал'],
    },
  },
  {
    id: 2,
    name: { ru: 'Верховная Жрица', uk: 'Верховна Жриця' },
    arcana: 'major',
    image: '/cards/major/02-high-priestess.webp',
    keywords: {
      ru: ['интуиция', 'тайна', 'подсознание', 'мудрость'],
      uk: ['інтуїція', 'таємниця', 'підсвідомість', 'мудрість'],
    },
    reversedKeywords: {
      ru: ['скрытые мотивы', 'отключение от интуиции'],
      uk: ['приховані мотиви', 'відключення від інтуїції'],
    },
  },
  {
    id: 3,
    name: { ru: 'Императрица', uk: 'Імператриця' },
    arcana: 'major',
    image: '/cards/major/03-empress.webp',
    keywords: {
      ru: ['изобилие', 'материнство', 'природа', 'красота'],
      uk: ['достаток', 'материнство', 'природа', 'краса'],
    },
    reversedKeywords: {
      ru: ['зависимость', 'пустота', 'удушающая забота'],
      uk: ['залежність', 'порожнеча', 'задушлива турбота'],
    },
  },
  {
    id: 4,
    name: { ru: 'Император', uk: 'Імператор' },
    arcana: 'major',
    image: '/cards/major/04-emperor.webp',
    keywords: {
      ru: ['власть', 'структура', 'контроль', 'отец'],
      uk: ['влада', 'структура', 'контроль', 'батько'],
    },
    reversedKeywords: {
      ru: ['тирания', 'жёсткость', 'потеря контроля'],
      uk: ['тиранія', 'жорсткість', 'втрата контролю'],
    },
  },
  {
    id: 5,
    name: { ru: 'Иерофант', uk: 'Ієрофант' },
    arcana: 'major',
    image: '/cards/major/05-hierophant.webp',
    keywords: {
      ru: ['традиция', 'учение', 'вера', 'наставник'],
      uk: ['традиція', 'вчення', 'віра', 'наставник'],
    },
    reversedKeywords: {
      ru: ['бунтарство', 'нетрадиционность', 'догма'],
      uk: ['бунтарство', 'нетрадиційність', 'догма'],
    },
  },
  {
    id: 6,
    name: { ru: 'Влюблённые', uk: 'Закохані' },
    arcana: 'major',
    image: '/cards/major/06-lovers.webp',
    keywords: {
      ru: ['любовь', 'выбор', 'гармония', 'партнёрство'],
      uk: ['кохання', 'вибір', 'гармонія', 'партнерство'],
    },
    reversedKeywords: {
      ru: ['дисгармония', 'неверный выбор', 'разлад'],
      uk: ['дисгармонія', 'невірний вибір', 'розлад'],
    },
  },
  {
    id: 7,
    name: { ru: 'Колесница', uk: 'Колісниця' },
    arcana: 'major',
    image: '/cards/major/07-chariot.webp',
    keywords: {
      ru: ['победа', 'воля', 'движение', 'решимость'],
      uk: ['перемога', 'воля', 'рух', 'рішучість'],
    },
    reversedKeywords: {
      ru: ['потеря направления', 'агрессия', 'поражение'],
      uk: ['втрата напрямку', 'агресія', 'поразка'],
    },
  },
  {
    id: 8,
    name: { ru: 'Сила', uk: 'Сила' },
    arcana: 'major',
    image: '/cards/major/08-strength.webp',
    keywords: {
      ru: ['внутренняя сила', 'храбрость', 'терпение', 'сострадание'],
      uk: ['внутрішня сила', 'хоробрість', 'терпіння', 'співчуття'],
    },
    reversedKeywords: {
      ru: ['слабость', 'сомнения', 'неуверенность'],
      uk: ['слабкість', 'сумніви', 'невпевненість'],
    },
  },
  {
    id: 9,
    name: { ru: 'Отшельник', uk: 'Відлюдник' },
    arcana: 'major',
    image: '/cards/major/09-hermit.webp',
    keywords: {
      ru: ['одиночество', 'поиск истины', 'мудрость', 'самопознание'],
      uk: ['самотність', 'пошук істини', 'мудрість', 'самопізнання'],
    },
    reversedKeywords: {
      ru: ['изоляция', 'паранойя', 'отчуждение'],
      uk: ['ізоляція', 'параноя', 'відчуження'],
    },
  },
  {
    id: 10,
    name: { ru: 'Колесо Фортуны', uk: 'Колесо Фортуни' },
    arcana: 'major',
    image: '/cards/major/10-wheel.webp',
    keywords: {
      ru: ['судьба', 'цикл', 'удача', 'перемены'],
      uk: ['доля', 'цикл', 'удача', 'зміни'],
    },
    reversedKeywords: {
      ru: ['невезение', 'сопротивление переменам'],
      uk: ['невдача', 'опір змінам'],
    },
  },
  {
    id: 11,
    name: { ru: 'Справедливость', uk: 'Справедливість' },
    arcana: 'major',
    image: '/cards/major/11-justice.webp',
    keywords: {
      ru: ['справедливость', 'истина', 'закон', 'баланс'],
      uk: ['справедливість', 'істина', 'закон', 'баланс'],
    },
    reversedKeywords: {
      ru: ['несправедливость', 'нечестность', 'дисбаланс'],
      uk: ['несправедливість', 'нечесність', 'дисбаланс'],
    },
  },
  {
    id: 12,
    name: { ru: 'Повешенный', uk: 'Повішений' },
    arcana: 'major',
    image: '/cards/major/12-hanged-man.webp',
    keywords: {
      ru: ['пауза', 'жертва', 'новый взгляд', 'отпускание'],
      uk: ['пауза', 'жертва', 'новий погляд', 'відпускання'],
    },
    reversedKeywords: {
      ru: ['застой', 'сопротивление', 'бессмысленная жертва'],
      uk: ['застій', 'опір', 'безглузда жертва'],
    },
  },
  {
    id: 13,
    name: { ru: 'Смерть', uk: 'Смерть' },
    arcana: 'major',
    image: '/cards/major/13-death.webp',
    keywords: {
      ru: ['трансформация', 'конец цикла', 'обновление'],
      uk: ['трансформація', 'кінець циклу', 'оновлення'],
    },
    reversedKeywords: {
      ru: ['сопротивление переменам', 'застой', 'страх'],
      uk: ['опір змінам', 'застій', 'страх'],
    },
  },
  {
    id: 14,
    name: { ru: 'Умеренность', uk: 'Поміркованість' },
    arcana: 'major',
    image: '/cards/major/14-temperance.webp',
    keywords: {
      ru: ['баланс', 'терпение', 'гармония', 'исцеление'],
      uk: ['баланс', 'терпіння', 'гармонія', 'зцілення'],
    },
    reversedKeywords: {
      ru: ['дисбаланс', 'крайности', 'нетерпение'],
      uk: ['дисбаланс', 'крайнощі', 'нетерпіння'],
    },
  },
  {
    id: 15,
    name: { ru: 'Дьявол', uk: 'Диявол' },
    arcana: 'major',
    image: '/cards/major/15-devil.webp',
    keywords: {
      ru: ['зависимость', 'материализм', 'искушение', 'тень'],
      uk: ['залежність', 'матеріалізм', 'спокуса', 'тінь'],
    },
    reversedKeywords: {
      ru: ['освобождение', 'осознание', 'разрыв цепей'],
      uk: ['звільнення', 'усвідомлення', 'розрив ланцюгів'],
    },
  },
  {
    id: 16,
    name: { ru: 'Башня', uk: 'Вежа' },
    arcana: 'major',
    image: '/cards/major/16-tower.webp',
    keywords: {
      ru: ['разрушение', 'внезапные перемены', 'откровение'],
      uk: ['руйнування', 'раптові зміни', 'одкровення'],
    },
    reversedKeywords: {
      ru: ['избегание катастрофы', 'страх перемен'],
      uk: ['уникнення катастрофи', 'страх змін'],
    },
  },
  {
    id: 17,
    name: { ru: 'Звезда', uk: 'Зірка' },
    arcana: 'major',
    image: '/cards/major/17-star.webp',
    keywords: {
      ru: ['надежда', 'вдохновение', 'обновление', 'вера'],
      uk: ['надія', 'натхнення', 'оновлення', 'віра'],
    },
    reversedKeywords: {
      ru: ['отчаяние', 'потеря веры', 'разочарование'],
      uk: ['відчай', 'втрата віри', 'розчарування'],
    },
  },
  {
    id: 18,
    name: { ru: 'Луна', uk: 'Місяць' },
    arcana: 'major',
    image: '/cards/major/18-moon.webp',
    keywords: {
      ru: ['иллюзия', 'страхи', 'подсознание', 'интуиция'],
      uk: ['ілюзія', 'страхи', 'підсвідомість', 'інтуїція'],
    },
    reversedKeywords: {
      ru: ['ясность', 'преодоление страхов', 'правда'],
      uk: ['ясність', 'подолання страхів', 'правда'],
    },
  },
  {
    id: 19,
    name: { ru: 'Солнце', uk: 'Сонце' },
    arcana: 'major',
    image: '/cards/major/19-sun.webp',
    keywords: {
      ru: ['радость', 'успех', 'ясность', 'жизненная сила'],
      uk: ['радість', 'успіх', 'ясність', 'життєва сила'],
    },
    reversedKeywords: {
      ru: ['временные трудности', 'задержка успеха'],
      uk: ['тимчасові труднощі', 'затримка успіху'],
    },
  },
  {
    id: 20,
    name: { ru: 'Суд', uk: 'Суд' },
    arcana: 'major',
    image: '/cards/major/20-judgement.webp',
    keywords: {
      ru: ['возрождение', 'призвание', 'прощение', 'оценка'],
      uk: ['відродження', 'покликання', 'прощення', 'оцінка'],
    },
    reversedKeywords: {
      ru: ['самокритика', 'нежелание меняться', 'сомнения'],
      uk: ['самокритика', 'небажання змінюватись', 'сумніви'],
    },
  },
  {
    id: 21,
    name: { ru: 'Мир', uk: 'Світ' },
    arcana: 'major',
    image: '/cards/major/21-world.webp',
    keywords: {
      ru: ['завершение', 'целостность', 'достижение', 'гармония'],
      uk: ['завершення', 'цілісність', 'досягнення', 'гармонія'],
    },
    reversedKeywords: {
      ru: ['незавершённость', 'задержка', 'неудовлетворённость'],
      uk: ['незавершеність', 'затримка', 'незадоволеність'],
    },
  },
];

// ─── Minor Arcana generator ──────────────────────────────────────────────────

const SUITS = {
  wands: { ru: 'Жезлов', uk: 'Жезлів' },
  cups: { ru: 'Кубков', uk: 'Кубків' },
  swords: { ru: 'Мечей', uk: 'Мечів' },
  pentacles: { ru: 'Пентаклей', uk: 'Пентаклів' },
} as const;

const COURT = {
  11: { ru: 'Паж', uk: 'Паж' },
  12: { ru: 'Рыцарь', uk: 'Лицар' },
  13: { ru: 'Королева', uk: 'Королева' },
  14: { ru: 'Король', uk: 'Король' },
} as const;

function generateMinorArcana(): TarotCard[] {
  const cards: TarotCard[] = [];
  let id = 22;

  for (const [suit, suitName] of Object.entries(SUITS)) {
    for (let num = 1; num <= 14; num++) {
      const isCourt = num > 10;
      const numName = isCourt
        ? COURT[num as keyof typeof COURT]
        : num === 1
          ? { ru: 'Туз', uk: 'Туз' }
          : { ru: String(num), uk: String(num) };

      cards.push({
        id: id++,
        name: {
          ru: `${numName.ru} ${suitName.ru}`,
          uk: `${numName.uk} ${suitName.uk}`,
        },
        arcana: 'minor',
        suit: suit as TarotCard['suit'],
        number: num,
        image: `/cards/minor/${suit}-${String(num).padStart(2, '0')}.webp`,
        keywords: { ru: [], uk: [] }, // filled via AI/data later
        reversedKeywords: { ru: [], uk: [] },
      });
    }
  }

  return cards;
}

export const MINOR_ARCANA = generateMinorArcana();
export const ALL_CARDS = [...MAJOR_ARCANA, ...MINOR_ARCANA];

// ─── Utility: draw random cards ──────────────────────────────────────────────

export function drawCards(count: number): (TarotCard & { reversed: boolean })[] {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    reversed: Math.random() > 0.65, // ~35% chance reversed
  }));
}
