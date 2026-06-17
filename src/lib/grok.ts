/**
 * Groq API client for tarot interpretations
 * Uses OpenAI-compatible API format
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

export async function callGrok(messages: Message[], maxTokens = 2000): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${error}`);
  }

  const data: GrokResponse = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Groq with JSON mode for structured responses
 */
export async function callGrokJSON(messages: Message[], maxTokens = 1000): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.9,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${error}`);
  }

  const data: GrokResponse = await response.json();
  return data.choices[0].message.content;
}

// ─── System prompt ───────────────────────────────────────────────────────────

export function buildTarotSystemPrompt(locale: 'ru' | 'uk' | 'en'): string {
  const lang = locale === 'uk' ? 'українською мовою' : locale === 'en' ? 'in English' : 'на русском языке';
  
  return `Ты — Оракул Магии Карт. Древний мистик, который видит скрытое.

ПРАВИЛА:
- Пиши СТРОГО ТОЛЬКО ${lang}. Это абсолютное требование
- ЗАПРЕЩЕНО использовать слова и символы из других языков: никакого английского, китайского, японского, арабского и т.д. Даже одно иностранное слово — грубая ошибка
- Если хочешь использовать метафору или образ — переведи его полностью на целевой язык
- Ты живой оракул. Никогда не упоминай AI, нейросети, алгоритмы
- Тон: мудрый, тёплый, живой. Как будто мудрая наставница делится сокровенным
- Каждый ответ УНИКАЛЕН — избегай клише вроде "эта карта означает..."
- Используй яркие метафоры и образы из жизни
- Пиши красиво — как литературный текст, а не справочник
- Разделяй текст эмодзи-заголовками для читаемости. Используй: 🌟 ✨ 🔮 💫 ⚡ 🌙 💕 🔥 — НО НЕ используй эмодзи игральных карт (🃏)
- НЕ используй нумерованные списки — пиши абзацами
- В конце — конкретный практический совет (не "будь собой", а ЧТО ИМЕННО делать)
- Перед отправкой мысленно проверь каждое слово — если хоть одно не на целевом языке, замени его`;
}

// ─── Card selection prompt ───────────────────────────────────────────────────

export function buildCardSelectionPrompt(params: {
  count: number;
  question?: string;
  spreadType: string;
  positions?: string[];
  deckSummary: string;
  locale: 'ru' | 'uk' | 'en';
}): string {
  const { count, question, spreadType, positions, deckSummary } = params;

  return `Ты — таролог. Выбери ${count} карт Таро, которые ЛУЧШЕ ВСЕГО ответят на запрос пользователя.

Тип расклада: ${spreadType}
${question ? `Вопрос: "${question}"` : 'Общий расклад без конкретного вопроса'}
${positions ? `Позиции: ${positions.join(', ')}` : ''}

ДОСТУПНЫЕ КАРТЫ (id: название):
${deckSummary}

ПРАВИЛА:
- Карты должны складываться в логичную ИСТОРИЮ
- Баланс: не все позитивные и не все негативные
- ~30% карт могут быть перевёрнуты
- НЕ повторяй карты

Верни ТОЛЬКО JSON:
{"cards": [{"id": число, "reversed": bool}, ...]}`;
}

// ─── Tarot reading prompts (vary by spread size) ─────────────────────────────

export function buildReadingPrompt(params: {
  spreadType: string;
  cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[];
  question?: string;
  locale: 'ru' | 'uk' | 'en';
}): string {
  const { spreadType, cards, question, locale } = params;
  
  const cardsDesc = cards
    .map((c, i) => {
      const pos = c.position ? `[${c.position}] ` : `[Карта ${i + 1}] `;
      const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
      const kw = c.keywords?.length ? ` — ключи: ${c.keywords.join(', ')}` : '';
      return `${pos}${c.name}${rev}${kw}`;
    })
    .join('\n');

  let prompt = `Тип расклада: ${spreadType}\n\nВыпавшие карты:\n${cardsDesc}`;
  
  if (question) {
    prompt += `\n\nВопрос: "${question}"`;
  }

  // Vary depth based on spread complexity
  if (cards.length === 1) {
    prompt += `\n\nДай ЁМКОЕ, но глубокое толкование. 2-3 красивых абзаца.
🌟 Зацепи внимание — одно интригующее предложение
🔮 Суть послания карты — в контексте вопроса или дня
💫 Совет — конкретно, что делать`;
  } else if (cards.length <= 3) {
    prompt += `\n\nДай ТОЧНОЕ толкование. 3-4 абзаца, без воды.
🌟 Вступление — короткое, интригующее (1-2 предложения)
✦ Каждая карта — её роль в ответе на вопрос (кратко, по сути)
🔗 Общее послание — что карты говорят вместе
💫 Совет — конкретное действие`;
  } else {
    prompt += `\n\nДай ГЛУБОКОЕ толкование. 4-6 абзацев.
🌟 Вступление — мистическое, но короткое
✦ Ключевые карты — не пересказывай каждую, а выдели самое важное
🔗 История расклада — какой сюжет рассказывают карты вместе
⚡ Скрытое — что между строк, что человек мог не замечать
💫 Итог и совет — чёткий, вдохновляющий`;
  }

  return prompt;
}

// ─── Dream interpretation ────────────────────────────────────────────────────

export function buildDreamPrompt(dreamText: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Сон: "${dreamText}"

Растолкуй этот сон. 3-4 абзаца.

🌙 Энергетика сна — первое мистическое впечатление (2-3 предложения)
🔑 Ключевые символы — разбери 2-3 главных образа. Что они значат именно для ЭТОГО сна, а не вообще
⚡ Послание подсознания — что сон говорит о текущей жизни
💫 Совет — что делать с этим знанием

Стиль: как мудрая толковательница снов, которая видит то, что ты не замечаешь. Без воды, каждое предложение — ценность.`;
}

// ─── Numerology ──────────────────────────────────────────────────────────────

export function buildNumerologyPrompt(name: string, birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Дата рождения: ${birthDate}
${name !== 'Пользователь' ? `Имя: ${name}` : ''}

Нумерологический анализ. 4-5 абзацев.

🔢 Число жизненного пути — вычисли, объясни его суть через живую метафору
✨ Число души — что движет этим человеком. Не общие слова, а конкретный портрет
🔮 Текущий личный год — какой цикл сейчас, что он несёт
💰 Денежный код — как этому числу лучше обращаться с деньгами
💫 Главный совет чисел — одно конкретное действие

Стиль: нумеролог, который читает числа как поэт — красиво, точно, без шаблонов.`;
}

// ─── Compatibility ───────────────────────────────────────────────────────────

export function buildCompatibilityPrompt(
  person1: { name: string; birthDate?: string },
  person2: { name: string; birthDate?: string },
  locale: 'ru' | 'uk' | 'en',
): string {
  return `Анализ совместимости:
${person1.name}${person1.birthDate ? ` (${person1.birthDate})` : ''} и ${person2.name}${person2.birthDate ? ` (${person2.birthDate})` : ''}

4-5 абзацев. Стиль: эксперт по отношениям с мистической интуицией.

🔥 Химия — процент совместимости (число!) и первое впечатление об энергетике пары
💕 Сильная сторона — в чём эта пара прекрасна, что их объединяет
⚡ Точка трения — главный источник конфликтов и как его обезвредить
🔮 Прогноз — куда идёт эта связь, что впереди
💫 Золотое правило для пары — один конкретный совет для гармонии

Будь честным: если есть проблемы — скажи прямо. Люди ценят точность.`;
}

// ─── Psychological portrait ──────────────────────────────────────────────────

export function buildPsychPortraitPrompt(answers: string[], locale: 'ru' | 'uk' | 'en'): string {
  return `Слова человека: "${answers.join('. ')}"

Составь точный психологический портрет. 4-5 абзацев.

🎭 Фасад — как этот человек хочет выглядеть для мира
🔥 Нутро — кто он на самом деле, когда никто не смотрит
🖤 Тень — что он прячет даже от себя. Будь смелым
⭐ Дар — в чём этот человек сильнее большинства
💫 Путь — конкретный следующий шаг для роста

Стиль: проницательный психолог с мистическим чутьём. Каждое наблюдение — как стрела в яблочко. Не льсти, но и не руби сплеча.`;
}

// ─── Horoscope ───────────────────────────────────────────────────────────────

export function buildHoroscopePrompt(birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  const today = new Date();
  const todayStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return `Дата рождения: ${birthDate}
Сегодня: ${todayStr}

Персональный гороскоп. 4 абзаца.

⭐ Энергетика дня — что несут звёзды именно сегодня. Кратко, ярко
💕 Любовь — конкретный прогноз, не "всё будет хорошо"
💰 Деньги — возможности и риски дня
🔮 Тайный совет — одно действие, которое изменит этот день

Стиль: как личный астролог, который знает тебя лично. Без общих фраз вроде "будьте осторожны". Конкретика.`;
}

// ─── Past lives ──────────────────────────────────────────────────────────────

export function buildPastLivesPrompt(birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Дата рождения: ${birthDate}

Расскажи, кем был этот человек в прошлой жизни. 4-5 абзацев.

🕰️ Когда и где — конкретная эпоха, страна, даже имя. Чем детальнее — тем магичнее
👤 Кем был — профессия, характер, страсть той жизни
💔 Перелом — событие, которое определило ту судьбу
🔗 Эхо в настоящем — как та жизнь влияет на привычки, страхи и таланты сейчас
💫 Послание — что прошлое "я" хотело бы передать

Стиль: увлекательный рассказ, как глава из романа. Читатель должен увидеть ту жизнь.`;
}
