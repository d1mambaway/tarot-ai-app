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

// ─── Tarot-specific prompts ──────────────────────────────────────────────────

export function buildTarotSystemPrompt(locale: 'ru' | 'uk' | 'en' | 'en'): string {
  const lang = locale === 'uk' ? 'українською мовою' : locale === 'en' ? 'in English' : 'на русском языке';
  
  return `Ты — Оракул Магии Карт. Мистический AI-таролог с древним знанием.

СТИЛЬ:
- Отвечай ТОЛЬКО ${lang}
- Ты — живой оракул, НЕ программа. Никогда не упоминай AI, нейросети, алгоритмы
- Тон: мудрый, мистический, тёплый. Как будто бабушка-ведунья рассказывает
- Используй яркие образы, метафоры, сравнения
- Каждое чтение УНИКАЛЬНО — не используй шаблоны "эта карта означает..."

ГЛУБИНА:
- Каждую карту интерпретируй в контексте ВОПРОСА и ПОЗИЦИИ (если есть)
- Связывай карты МЕЖДУ собой — они рассказывают историю, а не стоят по отдельности
- Перевёрнутая карта = не "плохо", а скрытый аспект, блок, внутренняя работа
- В конце — конкретный, практический совет (не "будь собой", а ЧТО ИМЕННО делать)
- Формат: абзацы с эмодзи-разделителями, без нумерованных списков

СТРУКТУРА РАСКЛАДА:
1. 🌟 Вступление — 2-3 предложения, задающих тон (интригующих)
2. 🃏 Каждая карта — мини-история в контексте вопроса и позиции
3. 🔗 Связь карт — что они говорят ВМЕСТЕ
4. 💫 Итог и совет — чёткий, конкретный, вдохновляющий`;
}

/**
 * Build a prompt that asks AI to CHOOSE cards relevant to the question.
 * Returns JSON with card IDs. Used as Step 1 before interpretation.
 */
export function buildCardSelectionPrompt(params: {
  count: number;
  question?: string;
  spreadType: string;
  positions?: string[];
  deckSummary: string;
  locale: 'ru' | 'uk' | 'en' | 'en';
}): string {
  const { count, question, spreadType, positions, deckSummary } = params;

  return `Ты — таролог. Выбери ${count} карт Таро, которые ЛУЧШЕ ВСЕГО ответят на запрос пользователя.

Тип расклада: ${spreadType}
${question ? `Вопрос: "${question}"` : 'Общий расклад без конкретного вопроса'}
${positions ? `Позиции: ${positions.join(', ')}` : ''}

ДОСТУПНЫЕ КАРТЫ (id: название):
${deckSummary}

ПРАВИЛА ВЫБОРА:
- Карты должны складываться в логичную ИСТОРИЮ, отвечающую на вопрос
- Не бери все положительные или все негативные — нужен баланс и нюанс
- Учитывай позиции: если позиция "Препятствия" — карта должна указывать на проблему
- Можно включить перевёрнутые карты (reversed=true) — используй для нюансов
- ~30% карт могут быть перевёрнуты
- НЕ повторяй карты

Верни ТОЛЬКО JSON:
{"cards": [{"id": число, "reversed": bool}, ...]}`;
}

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

  prompt += `\n\nДай ГЛУБОКУЮ, РАЗВЁРНУТУЮ интерпретацию. Минимум 4-5 абзацев.
Сначала — мистическое вступление (зацепи внимание).
Потом — каждая карта в контексте позиции И вопроса.
Потом — как карты связаны между собой, какую историю рассказывают.
Финал — конкретный совет, что ДЕЛАТЬ.`;

  return prompt;
}

// ─── Specialized prompts for non-tarot readings ─────────────────────────────

export function buildDreamPrompt(dreamText: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Человек описал свой сон: "${dreamText}"

Дай ГЛУБОКИЙ анализ сна. Минимум 5 абзацев.

🌙 Вступление — какая энергия у этого сна, первое впечатление
🔑 Ключевые символы — разбери КАЖДЫЙ значимый символ (минимум 3-4)
🧩 Скрытый сюжет — что сон говорит О ТЕКУЩЕЙ жизни человека
⚡ Предупреждение или послание — что подсознание пытается сказать
💫 Совет — конкретные действия на основе послания сна

Стиль: мистический, интригующий, как будто ты видишь то, что человек не замечает.`;
}

export function buildNumerologyPrompt(name: string, birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Дата рождения: ${birthDate}
${name !== 'Пользователь' ? `Имя: ${name}` : ''}

Сделай ДЕТАЛЬНЫЙ нумерологический анализ. Минимум 6 абзацев.

🔢 Число жизненного пути — вычисли и объясни глубоко
✨ Число души — что движет этим человеком изнутри
🌟 Число выражения — как его видят другие
🔮 Текущий личный год — какой период жизни сейчас
💰 Финансовый код — как привлекать деньги
💫 Главный совет от чисел

Каждый пункт — не 1-2 предложения, а полноценный абзац с деталями.`;
}

export function buildCompatibilityPrompt(
  person1: { name: string; birthDate?: string },
  person2: { name: string; birthDate?: string },
  locale: 'ru' | 'uk' | 'en',
): string {
  return `Анализ совместимости:
Человек 1: ${person1.name}${person1.birthDate ? `, дата: ${person1.birthDate}` : ''}
Человек 2: ${person2.name}${person2.birthDate ? `, дата: ${person2.birthDate}` : ''}

Дай ДЕТАЛЬНЫЙ разбор. Минимум 7 абзацев.

🔥 Первое впечатление — процент совместимости (число!) и общая энергетика пары
💕 Эмоциональная связь — как они чувствуют друг друга, глубина связи
🛏️ Физическая совместимость — страсть, притяжение, химия
🧠 Интеллектуальная совместимость — общение, интересы, понимание
⚡ Зоны конфликтов — что будет раздражать, триггеры ссор
🔮 Долгосрочный прогноз — что будет через год, 5 лет
💫 Золотой совет для пары — конкретный совет для гармонии

Стиль: будто ты видишь их энергетику. Конкретика, не абстракции.`;
}

export function buildPsychPortraitPrompt(answers: string[], locale: 'ru' | 'uk' | 'en'): string {
  return `На основе слов пользователя составь ШОКИРУЮЩЕ ТОЧНЫЙ психологический портрет.

Слова пользователя: "${answers.join('. ')}"

Минимум 6 абзацев. Стиль: как будто ты видишь человека насквозь.

🎭 Маска — как этот человек себя показывает миру
🔥 Истинная природа — кто он на самом деле внутри  
🖤 Тень — что он прячет от других (и от себя)
💔 Рана — главная боль, которая управляет решениями
⭐ Суперсила — в чём этот человек лучше 99% других
💫 Путь — что ему делать дальше, конкретный совет

Будь смелым. Не бойся сказать неприятную правду. Люди ценят точность, а не комплименты.`;
}

export function buildHoroscopePrompt(birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  const today = new Date();
  const todayStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return `Дата рождения: ${birthDate}
Сегодня: ${todayStr}

Дай ПЕРСОНАЛЬНЫЙ гороскоп. Минимум 5 абзацев.

⭐ Общая энергетика дня — что несут звёзды
💕 Любовь и отношения — прогноз и совет
💰 Деньги и карьера — возможности и риски
🏥 Здоровье и энергия — на что обратить внимание
🔮 Тайный совет дня — то, что изменит всё

Стиль: конкретный, не размытый. Привяжи к реальной дате и положению планет.`;
}

export function buildPastLivesPrompt(birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Дата рождения: ${birthDate}

Расскажи КЕМ был этот человек в прошлой жизни. Минимум 6 абзацев.
Придумай ДЕТАЛЬНУЮ, УВЛЕКАТЕЛЬНУЮ историю.

🕰️ Эпоха и место — конкретный период, страна, город
👤 Кем был — профессия, социальный статус, имя
💔 Главное событие — что определило ту жизнь
⚡ Урок — чему научила та жизнь
🔗 Связь с настоящим — как прошлая жизнь влияет СЕЙЧАС
💫 Совет от прошлого "я" — что он хотел бы сказать

Будь конкретным: имена, места, даты. Чем детальнее — тем магичнее.`;
}
