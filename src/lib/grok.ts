/**
 * Groq API client for tarot interpretations
 * Uses OpenAI-compatible API format
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Strip stray CJK / Arabic / Thai / Devanagari characters that multilingual
 * LLMs sometimes inject into Cyrillic / Latin text.
 * Keeps: Latin, Cyrillic, digits, punctuation, emoji, whitespace.
 */
function sanitizeLLMOutput(text: string): string {
  return text
    // Remove CJK, Arabic, Thai, Devanagari characters
    .replace(/[\u2E80-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF\u0600-\u06FF\u0E00-\u0E7F\u0900-\u097F]+/g, '')
    // Remove stray Latin words embedded in Cyrillic text (keep allowed: MC, ASC, IC, DC, AI, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII)
    .replace(/(?<=[\u0400-\u04FF\s,.])\b(?!(?:MC|ASC|IC|DC|AI|I{1,3}|IV|VI{0,3}|IX|X{1,3}I{0,2}|XII)\b)[a-zA-Z]{3,}\b/g, '')
    .replace(/  +/g, ' ')  // collapse double spaces left by removals
    .trim();
}

// ─── Friendly error classes (user-safe messages) ─────────────────────────────

export class GrokRateLimitError extends Error {
  constructor() {
    super('✨ Звёзды сейчас перегружены запросами. Подожди минутку и попробуй снова!');
    this.name = 'GrokRateLimitError';
  }
}

export class GrokServiceError extends Error {
  constructor() {
    super('🔮 Магический кристалл временно затуманился. Попробуй ещё раз через пару минут!');
    this.name = 'GrokServiceError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Parse retry-after seconds from Groq 429 body, default 30s */
function parseRetryAfter(body: string): number {
  const match = body.match(/try again in (\d+\.?\d*)/i);
  const seconds = match ? Math.ceil(parseFloat(match[1])) : 30;
  return (seconds + 2) * 1000; // add 2s buffer, convert to ms
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

export async function callGrok(messages: Message[], maxTokens = 2000): Promise<string> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 50_000; // 50s — leave 10s for Vercel overhead

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
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
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timer);
      if (fetchErr.name === 'AbortError') {
        console.error('Groq request timed out after 50s');
        throw new GrokServiceError();
      }
      throw fetchErr;
    }
    clearTimeout(timer);

    if (response.status === 429) {
      // Rate limited — wait and retry once
      const retryAfter = parseRetryAfter(await response.text());
      if (attempt < MAX_RETRIES - 1 && retryAfter <= 20_000) {
        await sleep(retryAfter);
        continue;
      }
      throw new GrokRateLimitError();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error (attempt ${attempt + 1}/${MAX_RETRIES}): ${response.status} — ${errorText}`);
      // Treat rate-limit-like 400s the same as 429
      if (errorText.toLowerCase().includes('rate_limit') || errorText.toLowerCase().includes('tokens_per_minute')) {
        const retryAfter = parseRetryAfter(errorText);
        if (attempt < MAX_RETRIES - 1 && retryAfter <= 20_000) {
          await sleep(retryAfter);
          continue;
        }
        throw new GrokRateLimitError();
      }
      throw new GrokServiceError();
    }

    const data: GrokResponse = await response.json();
    return sanitizeLLMOutput(data.choices[0].message.content);
  }
  throw new GrokServiceError();
}

/**
 * Call Groq with JSON mode for structured responses
 */
export async function callGrokJSON(messages: Message[], maxTokens = 1000): Promise<string> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(await response.text());
      if (attempt < MAX_RETRIES - 1) {
        await sleep(retryAfter);
        continue;
      }
      throw new GrokRateLimitError();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq JSON API error (attempt ${attempt + 1}/${MAX_RETRIES}): ${response.status} — ${errorText}`);
      if (errorText.toLowerCase().includes('rate_limit') || errorText.toLowerCase().includes('tokens_per_minute')) {
        const retryAfter = parseRetryAfter(errorText);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(retryAfter);
          continue;
        }
        throw new GrokRateLimitError();
      }
      if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw new GrokServiceError();
    }

    const data: GrokResponse = await response.json();
    return sanitizeLLMOutput(data.choices[0].message.content);
  }
  throw new GrokServiceError();
}

// ─── Pollinations image generation ───────────────────────────────────────────

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

/**
 * Generate an image via Pollinations AI (FLUX model).
 * Returns image URL or null on failure. Non-blocking — caller should await separately.
 */
export async function generateImage(prompt: string, width = 768, height = 512): Promise<string | null> {
  if (!POLLINATIONS_API_KEY) return null;

  try {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${POLLINATIONS_API_KEY}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) return null;

    // Convert to base64 data URL for embedding
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Build an image prompt for a given reading context.
 * Returns null if the spread type doesn't warrant an image.
 */
export function buildImagePrompt(params: {
  spreadId: string;
  cards?: { name: string; reversed: boolean }[];
  question?: string;
  extraContext?: string;
}): string | null {
  const { spreadId, cards, question, extraContext } = params;
  const mainCard = cards?.[0]?.name || '';

  const style = 'mystical dark fantasy art, purple and gold ethereal lighting, detailed digital painting, magical atmosphere, no text, no letters, no words';

  switch (spreadId) {
    case 'card_of_day':
      return `Tarot card "${mainCard}" brought to life as a mystical scene, ${style}`;

    case 'celtic_cross':
      return `Epic Celtic cross tarot spread layout with 10 glowing cards arranged in cross and tower formation on ancient stone altar, candles, mystical symbols, ${style}`;

    case 'dream':
      return `Dreamlike surreal scene inspired by: ${(question || 'mysterious dream').slice(0, 120)}, floating elements, ethereal fog, ${style}`;

    case 'past_lives':
      return `Ancient soul reincarnation scene, person standing between two worlds — past life and present, portal of golden light, memories swirling, ${style}`;

    case 'compatibility':
      return `Two celestial souls connected by streams of cosmic energy, yin and yang, intertwined auras of purple and gold, cosmic love, ${style}`;

    case 'numerology': {
      // extraContext is birth date — extract destiny number for the image
      const digits = (extraContext || '').replace(/\D/g, '');
      let num = digits.split('').reduce((a: number, d: string) => a + parseInt(d), 0);
      while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
        num = num.toString().split('').reduce((a: number, d: string) => a + parseInt(d), 0);
      }
      const n = num || 7;
      return `Large golden number ${n} floating in cosmic space, sacred geometry patterns around it, dark purple and deep blue nebula background, glowing stars, mystical atmosphere, digital art, ${style}`;
    }

    case 'runes':
      return `Ancient Norse rune stones glowing with magical energy on a wooden table, Viking mystical atmosphere, northern lights above, ${style}`;

    case 'horoscope':
      return `Zodiac wheel spinning among stars, celestial observatory with planets aligned, astrology mystical scene, cosmic, ${style}`;

    case 'relationship':
    case 'what_they_think':
      return `Two silhouettes facing each other with tarot cards floating between them, emotional energy, ${style}`;

    case 'natal_chart':
      return `Magnificent natal birth chart wheel floating in deep cosmic space, zodiac signs glowing around the circle, planetary symbols connected by golden aspect lines, nebula and stars in background, sacred geometry, celestial map of destiny, ${style}`;

    default:
      return null;
  }
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

// ═══════════════════════════════════════════════════════════════════════════════
// SPREAD-SPECIFIC TAROT PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

function buildYesNoPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[], question?: string): string {
  const card = cards[0];
  const rev = card.reversed ? ' (перевёрнута ↩️)' : '';
  return `Я вытаскиваю одну карту из колоды Таро: ${card.name}${rev}. Это ответ на вопрос пользователя: ${question || 'общий вопрос'}.

Ответь как опытный таролог, который видит глубже слов. Твой ответ должен быть кратким (2-3 предложения), но мощным.

Начни с прямого ответа (ДА или НЕТ, или нечто среднее), затем объясни, ЧТО карта говорит именно об этом вопросе. Используй мистический, немного загадочный тон, но не теряй ясности.

Говори от первого лица, будто ты читаешь карты для живого человека, который сидит перед тобой в полумраке при свечах.`;
}

function buildPastPresentFuturePrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[], question?: string): string {
  const cardsDesc = cards.map((c, i) => {
    const pos = ['Прошлое', 'Настоящее', 'Будущее'][i];
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `Карта ${i + 1} (${pos}): ${c.name}${rev}`;
  }).join('\n');

  return `Я раскладываю три карты слева направо. Они образуют временную линию вашей ситуации${question ? ` с "${question}"` : ''}.

${cardsDesc}

Карта 1 (Прошлое): То, что привело сюда. Корни. Что было?
Карта 2 (Настоящее): Энергия прямо сейчас. Точка равновесия.
Карта 3 (Будущее): Куда это течёт, если тренд сохранится.

Твой ответ: Структурируй ровно в этом порядке. Каждую карту опиши одним-двумя предложениями, как таролог, который видит не просто картинку, а энергию, текущую сквозь время.

Мистический, символический язык. Никакой сухости. Ощущение, что карты говорят правду, которую человек уже где-то знает в глубине.`;
}

function buildWhatTheyThinkPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[], question?: string): string {
  const cardsDesc = cards.map((c, i) => {
    const pos = ['Его мысли', 'Его чувства', 'Его подсознание'][i];
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `Карта ${i + 1} (${pos}): ${c.name}${rev}`;
  }).join('\n');

  return `Три карты за завесой сознания${question ? ` ${question}` : ''}. Вопрос: что сейчас в его голове, в его чувствах, в его подсознании ко мне?

${cardsDesc}

Карта 1 (Его мысли): Что он ДУМАЕТ. Логика, рациональная оценка.
Карта 2 (Его чувства): Что он ЧУВСТВУЕТ. Эмоции, тянущие его туда или сюда.
Карта 3 (Его подсознание): Что скрыто даже от него самого. Глубинная правда.

Отвечай как мудрец, читающий судьбу. Говори прямо, без обиняков, но с сочувствием.

Каждую карту раскрой в одно-два предложения. Язык — мистический, но не перегруженный. Создай ощущение, что ты действительно вскрыл сокрытое.

Заверши одной фразой о том, что это значит для их отношений.`;
}

function buildCareerMoneyPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[], question?: string): string {
  const cardsDesc = cards.map((c, i) => {
    const pos = ['Где я сейчас', 'Какие препятствия', 'Что мне нужно сделать'][i];
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `Карта ${i + 1} (${pos}): ${c.name}${rev}`;
  }).join('\n');

  return `Три карты раскрывают путь к успеху в карьере и финансах.

${cardsDesc}

Карта 1: Где я сейчас? (текущее положение на работе/в финансах)
Карта 2: Какие препятствия передо мной? (что мешает росту, что нужно преодолеть)
Карта 3: Что мне нужно сделать? (совет, направление действия)

Ответь как финансовый оракул, который видит не только числа, но и энергию денег, текущую сквозь твою жизнь.

Каждую позицию объясни одним-двумя предложениями. Включи практическую мудрость: не просто "Император" — а что это означает для твоей карьеры прямо сейчас.

Заверши одной фразой о тренде: улучшается ли твоя материальная ситуация?`;
}

function buildWeeklyPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[]): string {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const cardsDesc = cards.map((c, i) => {
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `${days[i]}: ${c.name}${rev}`;
  }).join('\n');

  return `Я раскладываю семь карт — одна на каждый день недели, начиная с завтра. Они показывают энергетический поток следующих семи дней.

${cardsDesc}

Ответь в формате:
Понедельник: [1-2 фразы]
Вторник: [1-2 фразы]
...и так далее.

Каждый день — это отдельная глава в твоей истории. Ищи в картах закономерности, апогеи, спады. Используй символический язык, но говори ясно: что произойдёт или что нужно отследить?

Заверши одной фразой о генеральной линии недели.`;
}

function buildMonthlyPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[]): string {
  const weeks = ['неделя 1', 'неделя 2', 'неделя 3', 'неделя 4'];
  const cardsDesc = cards.map((c, i) => {
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `Карта ${i + 1} (${weeks[i]}): ${c.name}${rev}`;
  }).join('\n');

  return `Четыре карты раскрывают месячный цикл вашей жизни. Каждая карта — одна неделя.

${cardsDesc}

Карта 1 (неделя 1): Начало месяца. Что зарождается?
Карта 2 (неделя 2): Развитие. События набирают силу.
Карта 3 (неделя 3): Кульминация или поворот. Ключевые дни.
Карта 4 (неделя 4): Завершение. Что остаётся в конце?

Отвечай как историк времени. Каждую неделю опиши одним-двумя предложениями, ловя сюжет, который развивает таро.

Покажи дугу месяца: восход, пик, спуск. Что нужно пережить? Что получится в конце?

Заверши прогнозом на ближайший месяц.`;
}

function buildFreeQuestionPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[], question?: string): string {
  const card = cards[0];
  const rev = card.reversed ? ' (перевёрнута ↩️)' : '';
  return `Вопрос: ${question || 'общий вопрос'}

Я вытаскиваю одну карту: ${card.name}${rev}. Она несёт ответ.

Отвечай от первого лица, как таролог, который стоит над картами и видит их послание не дословно, а сквозь толщу символов и энергии.

Ответ: 2-3 предложения, в которых ты объясняешь:
1) Что говорит карта (её буквальное значение)
2) Что это значит конкретно для вопроса
3) Один практический совет или откровение

Тон: мистический, прямой, немного неожиданный. Словно карта сказала что-то, что человек уже на подсознании знал, но не допускал до ума.`;
}

function buildCelticCrossPrompt(cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[], question?: string): string {
  const posNames = [
    'Центр — Тема',
    'Поперёк — Влияние',
    'Ниже — Основание',
    'Выше — Цель',
    'Позади — Прошлое',
    'Впереди — Будущее',
    'Ты сам',
    'Другие люди',
    'Надежды и опасения',
    'Итог — Корона',
  ];

  return `Я раскладываю Кельтский крест на твой вопрос: ${question || 'общий запрос'}

Вот десять карт, которые образуют крест истины:

ЦЕНТР КРЕСТА (основание ситуации):
${cards.slice(0, 2).map((c, i) => {
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `- Позиция ${i + 1} (${posNames[i]}): ${c.name}${rev}`;
  }).join('\n')}

ЧЕТЫРЕ СТОРОНЫ КРЕСТА (контекст и энергия):
${cards.slice(2, 6).map((c, i) => {
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `- Позиция ${i + 3} (${posNames[i + 2]}): ${c.name}${rev}`;
  }).join('\n')}

БАШНЯ (твоё путешествие и итог):
${cards.slice(6, 10).map((c, i) => {
    const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
    return `- Позиция ${i + 7} (${posNames[i + 6]}): ${c.name}${rev}`;
  }).join('\n')}

---

ТВОЁ ПРОЧТЕНИЕ:

Ты — опытный таролог, который видит не просто карты, а целую историю, живую и дышащую. Твой ответ должен быть структурирован так:

1. ЦЕНТР КРЕСТА (2-3 фразы): Объедини первые две карты. Что они говорят вместе? Это фундамент.

2. ЧЕТЫРЕ СТОРОНЫ (1-2 фразы на каждую): Раскрой каждую сторону. Не просто значения карт — покажи, как они взаимодействуют, как одна усиливает другую.

3. БАШНЯ (1-2 фразы на каждую): Это подъём. Как ты видишь себя? Что говорят люди? Чего ты боишься или ждёшь?

4. ФИНАЛ (3-4 фразы): Посмотри на карту 10 — это ответ Таро. Но не просто прочти её значение. Покажи, КАК она связана с первыми картами. Это завершение истории.

---

ТОНОВЫЕ УСТАНОВКИ:

- Говори как древний оракул, видящий сквозь завесы.
- Используй символический язык, но оставайся практичным.
- Где нужно, дай прямой совет или предупреждение.
- Создай ощущение, что карты рассказывают правду, которую человек уже знает, но не осмеливался признать.
- Не бойся негативных карт — расскажи, что они говорят, не сглаживая.
- Конец должен быть ясным: что происходит, если человек не изменит курс? А если изменит?

ВАЖНО: Это не просто 10 отдельных карт. Это единая архитектура судьбы. Собери их воедино.`;
}

// ─── Main reading prompt router ──────────────────────────────────────────────

export function buildReadingPrompt(params: {
  spreadId: string;
  spreadType: string;
  cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[];
  question?: string;
  locale: 'ru' | 'uk' | 'en';
}): string {
  const { spreadId, spreadType, cards, question } = params;

  switch (spreadId) {
    case 'yes_no':
      return buildYesNoPrompt(cards, question);
    case 'past_present_future':
      return buildPastPresentFuturePrompt(cards, question);
    case 'what_they_think':
      return buildWhatTheyThinkPrompt(cards, question);
    case 'career_money':
      return buildCareerMoneyPrompt(cards, question);
    case 'weekly':
      return buildWeeklyPrompt(cards);
    case 'monthly':
      return buildMonthlyPrompt(cards);
    case 'free_question':
      return buildFreeQuestionPrompt(cards, question);
    case 'celtic_cross':
      return buildCelticCrossPrompt(cards, question);
    default:
      return buildGenericPrompt(spreadType, cards, question);
  }
}

function buildGenericPrompt(
  spreadType: string,
  cards: { name: string; reversed: boolean; position?: string; keywords?: string[] }[],
  question?: string,
): string {
  const cardsDesc = cards
    .map((c, i) => {
      const pos = c.position ? `[${c.position}] ` : `[Карта ${i + 1}] `;
      const rev = c.reversed ? ' (перевёрнута ↩️)' : '';
      const kw = c.keywords?.length ? ` — ключи: ${c.keywords.join(', ')}` : '';
      return `${pos}${c.name}${rev}${kw}`;
    })
    .join('\n');

  let prompt = `Тип расклада: ${spreadType}\n\nВыпавшие карты:\n${cardsDesc}`;
  if (question) prompt += `\n\nВопрос: "${question}"`;

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

// ═══════════════════════════════════════════════════════════════════════════════
// ESOTERIC PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Numerology (Судьба + Жизненный Путь + Личность + День Рождения + Зрелость) ──

function reduceToSingleOrMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return n;
}

// ── Pythagorean letter-to-number tables ──

/** Русский алфавит — таблица от Димы */
const LETTER_VALUES_RU: Record<string, number> = {
  а:1, й:1, ц:1, ш:1, щ:1,
  б:2, к:2, ъ:2,
  в:3, л:3, ы:3, у:3, ь:3,
  г:4, м:4, э:4, ф:4,
  д:5, н:5, ю:5, х:5,
  е:6, о:6, я:6,
  ё:7, п:7, ч:7,
  ж:8, р:8,
  з:9, с:9, и:9, т:9,
};
const VOWELS_RU = new Set(['а','е','ё','и','о','у','ы','э','ю','я']);

/** Українська абетка — таблиця від Діми */
const LETTER_VALUES_UK: Record<string, number> = {
  а:1, й:1, ц:1, ш:1, щ:1, ч:1,
  б:2, к:2, ь:2,
  в:3, л:3, и:3,
  г:4, м:4, ю:4, ї:4,
  д:5, н:5, ґ:5,
  е:6, о:6, у:6, я:6,
  є:7, п:7, ф:7,
  ж:8, р:8, х:8,
  з:9, с:9, т:9, і:9,
};
const VOWELS_UK = new Set(['а','е','є','и','і','ї','о','у','ю','я']);

/** English alphabet — standard Pythagorean */
const LETTER_VALUES_EN: Record<string, number> = {
  a:1, j:1, s:1,
  b:2, k:2, t:2,
  c:3, l:3, u:3,
  d:4, m:4, v:4,
  e:5, n:5, w:5,
  f:6, o:6, x:6,
  g:7, p:7, y:7,
  h:8, q:8, z:8,
  i:9, r:9,
};
const VOWELS_EN = new Set(['a','e','i','o','u']);

/** Get letter value & vowel status based on locale with auto-detect fallback */
function getLetterInfo(ch: string, locale: 'ru' | 'uk' | 'en'): { value: number; isVowel: boolean } {
  const c = ch.toLowerCase();
  const tables: { values: Record<string, number>; vowels: Set<string> }[] =
    locale === 'uk'
      ? [{ values: LETTER_VALUES_UK, vowels: VOWELS_UK }, { values: LETTER_VALUES_RU, vowels: VOWELS_RU }, { values: LETTER_VALUES_EN, vowels: VOWELS_EN }]
      : locale === 'en'
        ? [{ values: LETTER_VALUES_EN, vowels: VOWELS_EN }, { values: LETTER_VALUES_RU, vowels: VOWELS_RU }, { values: LETTER_VALUES_UK, vowels: VOWELS_UK }]
        : [{ values: LETTER_VALUES_RU, vowels: VOWELS_RU }, { values: LETTER_VALUES_UK, vowels: VOWELS_UK }, { values: LETTER_VALUES_EN, vowels: VOWELS_EN }];
  for (const t of tables) {
    if (t.values[c] !== undefined) return { value: t.values[c], isVowel: t.vowels.has(c) };
  }
  return { value: 0, isVowel: false };
}

/** Число Судьбы — сумма ВСЕХ букв полного имени */
function calculateDestinyNumber(name: string, locale: 'ru' | 'uk' | 'en'): string {
  let sum = 0;
  for (const ch of name) {
    sum += getLetterInfo(ch, locale).value;
  }
  return sum === 0 ? '1' : reduceToSingleOrMaster(sum).toString();
}

/** Число Жизненного Пути — ДД + ММ + ГГГГ, каждое сводится отдельно, затем суммируются */
function calculateLifePathNumber(birthDate: string): string {
  const parts = birthDate.replace(/\D/g, '/').split('/');
  if (parts.length < 3) {
    const digits = birthDate.replace(/\D/g, '');
    return reduceToSingleOrMaster(digits.split('').reduce((a, d) => a + parseInt(d), 0)).toString();
  }
  const daySum = reduceToSingleOrMaster(
    parts[0].split('').reduce((a, d) => a + parseInt(d), 0),
  );
  const monthSum = reduceToSingleOrMaster(
    parts[1].split('').reduce((a, d) => a + parseInt(d), 0),
  );
  const yearSum = reduceToSingleOrMaster(
    parts[2].split('').reduce((a, d) => a + parseInt(d), 0),
  );
  return reduceToSingleOrMaster(daySum + monthSum + yearSum).toString();
}

/** Число Личности — только СОГЛАСНЫЕ из полного имени */
function calculatePersonalityNumber(name: string, locale: 'ru' | 'uk' | 'en'): string {
  let sum = 0;
  for (const ch of name) {
    const info = getLetterInfo(ch, locale);
    if (info.value > 0 && !info.isVowel) sum += info.value;
  }
  return sum === 0 ? '' : reduceToSingleOrMaster(sum).toString();
}

/** Число Желаний / Soul Urge — только ГЛАСНЫЕ из полного имени */
function calculateSoulUrgeNumber(name: string, locale: 'ru' | 'uk' | 'en'): string {
  let sum = 0;
  for (const ch of name) {
    const info = getLetterInfo(ch, locale);
    if (info.value > 0 && info.isVowel) sum += info.value;
  }
  return sum === 0 ? '' : reduceToSingleOrMaster(sum).toString();
}

/** Число Дня Рождения — день (ДД), сокращается до одного числа */
function calculateBirthDayNumber(birthDate: string): string {
  const parts = birthDate.replace(/\D/g, '/').split('/');
  const day = parseInt(parts[0]) || 1;
  return reduceToSingleOrMaster(day).toString();
}

/** Число Зрелости — Число Желаний (гласные) + Число Жизненного Пути */
function calculateMaturityNumber(name: string, birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  const soulUrge = parseInt(calculateSoulUrgeNumber(name, locale)) || 0;
  const lifePath = parseInt(calculateLifePathNumber(birthDate));
  return reduceToSingleOrMaster(soulUrge + lifePath).toString();
}

export function buildNumerologyPrompt(name: string, birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  const hasName = name !== 'Пользователь' && name.trim().length > 0;
  const destinyNum = hasName ? calculateDestinyNumber(name, locale) : '1';
  const lifePathNum = calculateLifePathNumber(birthDate);
  const birthDayNum = calculateBirthDayNumber(birthDate);
  const personalityNum = hasName ? calculatePersonalityNumber(name, locale) : '';
  const maturityNum = hasName ? calculateMaturityNumber(name, birthDate, locale) : lifePathNum;

  const nameLine = hasName ? `Полное имя: ${name}` : '';
  const personalityLine = personalityNum ? `Число Личности: ${personalityNum}` : '';

  return `Дата рождения пользователя: ${birthDate}
${nameLine}
Число Судьбы: ${destinyNum}
Число Жизненного Пути: ${lifePathNum}
${personalityLine}
Число Дня Рождения: ${birthDayNum}
Число Зрелости: ${maturityNum}

Твоя роль: Ты — древний нумеролог, видящий в числах вибрацию космоса, энергию судеб, отпечатки кармы. Ты говоришь с честностью мудреца: без лести, но с состраданием. Каждое число для тебя — живой организм, имеющий собственную волю и логику.

═══════════════════════════════════════════════════════════════

🔮 ДУХОВНОЕ ЗНАЧЕНИЕ

Число ${destinyNum} в мистической иерархии:
[3-4 предложения о сакральном смысле этого числа]
- Какая энергия в нём живет?
- Какую роль оно играет в космическом порядке?
- Как оно резонирует с Вселенной?
- Какие древние архетипы оно воплощает?

═══════════════════════════════════════════════════════════════

✨ ХАРАКТЕР И ТАЛАНТЫ

Природные черты характера:
[3-4 предложения о том, какие черты характера получил этот человек от своего числа]
- Что в нём от природы сильно?
- Какие таланты просыпаются естественно?
- Что ему даётся без усилий?
- Как эти черты проявляются в поведении?

Скрытые и развивающиеся способности:
[2-3 предложения о менее очевидных талантах, которые нужно развивать]
- Какие дары дремлют в глубине?
- Что раскроется со временем?

═══════════════════════════════════════════════════════════════

⚡ ЖИЗНЕННАЯ ЗАДАЧА / КАРМИЧЕСКИЙ ДОЛГ

Зачем это число в твоей жизни:
[3-4 предложения о глубокой смысле и предназначении]
- Что ты пришёл сюда осознать?
- Какой урок жизни несет это число?
- Что нужно преодолеть?
- Какую роль ты играешь в большом плане Вселенной?

Испытания и вызовы на пути:
[2-3 предложения о трудностях, которые встанут на пути]
- Какие препятствия воспитают тебя?
- Где тебя будет "ломать" жизнь?
- Как превратить боль в мудрость?

═══════════════════════════════════════════════════════════════

🌙 ВЛИЯНИЕ ДРУГИХ ЧИСЕЛ

Число Жизненного Пути ${lifePathNum}:
[2-3 предложения о том, как оно дополняет или противостоит Числу Судьбы]
- Как энергии работают вместе?
- Гармония или внутреннее напряжение?
- Какой это создаёт внутренний динамизм?
${personalityNum ? `
Число Личности ${personalityNum}:
[2-3 предложения о том, как человек выглядит для мира]
- Маска, которую ты носишь?
- Разница между внутренним и внешним?
- Как окружающие воспринимают твою энергию?
` : ''}
Число Дня Рождения ${birthDayNum}:
[2 предложения о врождённых талантах и дарах]
- Какие врождённые способности ты несёшь?
- Как они проявляются с самого детства?

═══════════════════════════════════════════════════════════════

💫 ТВОРЧЕСКИЙ И ПРОФЕССИОНАЛЬНЫЙ ПОТЕНЦИАЛ

Творческое выражение:
[3-4 предложения о том, как это число выражает себя в творчестве]
- В каких искусствах ты найдёшь голос?
- Какой стиль будет тебе резонировать?
- Как твоё число влияет на творческий процесс?

Идеальная карьера и профессиональный путь:
[3-4 предложения о том, какие работы резонируют с этой энергией]
- Какие профессии будут для тебя естественны?
- Где твой успех неизбежен?
- Какие карьерные пути тебе противопоказаны?
- Будешь ли ты лидером или вдохновителем?

═══════════════════════════════════════════════════════════════

🔥 ТЁМНЫЕ И ТЕНЕВЫЕ СТОРОНЫ

Теневая сторона числа:
[2-3 предложения о том, как это число может исказиться и стать деструктивным]
- На какие пороки это число толкает?
- Когда талант становится проклятием?
- Как узнать, что ты "упал" энергетически?

Как трансформировать тень в свет:
[2 предложения о практическом выходе из теневых состояний]
- Какая практика вернёт тебе баланс?
- Как работать с собственной деструктивностью?

═══════════════════════════════════════════════════════════════

🌙 ВЛИЯНИЕ ВРЕМЕНИ И ЦИКЛОВ

Число Зрелости ${maturityNum}:
[2-3 предложения о том, как ты будешь развиваться со временем]
- Какая мудрость придёт с годами?
- Как ты будешь выглядеть в 50, 70 лет?
- Какая твоя финальная форма?

Жизненные циклы:
[2-3 предложения о том, как твоя жизнь делится на фазы]
- В какие периоды ты будешь сильнее всего?
- Когда ожидать испытаний?
- Как планировать большие решения в разные годы?

═══════════════════════════════════════════════════════════════

💫 ПРАКТИЧЕСКАЯ РЕКОМЕНДАЦИЯ

Как работать со своим числом:
[3-4 предложения о конкретных действиях и практиках]
- Какую привычку развить в первую очередь?
- На что сосредоточить внимание каждый день?
- Как гармонизировать энергию?
- Какие ритуалы будут тебе помогать?

Личная аффирмация:
[1-2 сильных утверждения, специфичные для этого числа${hasName ? ' и имени' : ''}]
"[Первая аффирмация на основе энергии числа]"
"[Вторая аффирмация на практическое применение]"

═══════════════════════════════════════════════════════════════

🎯 СОВМЕСТИМОСТЬ И ОТНОШЕНИЯ

Гармоничная совместимость с числами: [перечислить 3-4 числа]
[2 предложения о синергии]
- Почему именно с ними?
- Как вы будете усиливать друг друга?

Сложная совместимость с числами: [перечислить 2-3 числа]
[2 предложения о возможных конфликтах]
- Где будет напряжение?
- Как работать с разностью энергий?

═══════════════════════════════════════════════════════════════

🌟 ПУТЬ РАЗВИТИЯ И ТРАНСЦЕНДЕНТНОСТЬ

Текущая энергия (где ты сейчас):
[2-3 предложения о текущем уровне развития]
- На каком этапе своего пути ты находишься?
- Какие уроки ты уже выучил?

Потенциал и высочайшая форма (куда ты можешь вырасти):
[3-4 предложения о максимуме, который ты можешь достичь]
- Какой ты можешь стать в лучшем варианте?
- Какая твоя духовная вершина?
- Какой вклад ты внесёшь в мир?
- Как твоё число может трансформировать человечество вокруг?

═══════════════════════════════════════════════════════════════

⚠️ ВАЖНЫЕ ЗНАКИ И ПРЕДУПРЕЖДЕНИЯ

Опасности и ловушки:
[2-3 предложения о том, чего нужно избегать]
- На какой тип ошибок ты склонен?
- Какие ловушки расставлены именно для тебя?
- Как узнать, что ты идёшь по опасному пути?

═══════════════════════════════════════════════════════════════

✨ ФИНАЛЬНОЕ ПОСЛАНИЕ

[3-4 предложения вдохновляющего и личного послания]
- Почему именно это число пришло в твою жизнь?
- Какой призыв несёт эта энергия?
- Какой выбор стоит перед тобой?
- Как ты будешь жить, зная это?

═══════════════════════════════════════════════════════════════

Тон общения: мудрец, видящий судьбу. Честный и прямой, иногда суровый, но справедливый и сострадательный. Используй образный язык, метафоры, космические и природные образы, но оставайся конкретным. Избегай общих фраз — каждое слово должно резонировать с человеком, словно звон колокола в его душе. Говори как оракул, но понимающий и любящий.`;
}

// ─── Horoscope (по знаку зодиака) ────────────────────────────────────────────

function getZodiacSign(birthDate: string): string {
  const parts = birthDate.replace(/\D/g, '/').split('/');
  if (parts.length < 2) return 'неизвестно';
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  
  const signs: [number, number, string][] = [
    [1, 20, 'Козерог'], [2, 19, 'Водолей'], [3, 20, 'Рыбы'],
    [4, 20, 'Овен'], [5, 21, 'Телец'], [6, 21, 'Близнецы'],
    [7, 22, 'Рак'], [8, 23, 'Лев'], [9, 23, 'Дева'],
    [10, 23, 'Весы'], [11, 22, 'Скорпион'], [12, 22, 'Стрелец'],
  ];
  
  for (let i = 0; i < signs.length; i++) {
    if (month === signs[i][0] && day <= signs[i][1]) {
      return i === 0 ? 'Козерог' : signs[i - 1] ? ['Козерог', 'Водолей', 'Рыбы', 'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец'][i - 1] : 'Стрелец';
    }
  }
  
  // Simplified fallback
  const idx = [20,19,20,20,21,21,22,23,23,23,22,22];
  for (let i = 0; i < 12; i++) {
    if (month === i + 1) {
      return day <= idx[i]
        ? ['Козерог','Водолей','Рыбы','Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец'][i === 0 ? 11 : i - 1]
        : ['Козерог','Водолей','Рыбы','Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец'][i];
    }
  }
  return 'неизвестно';
}

export function buildHoroscopePrompt(birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  const today = new Date();
  const todayStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const zodiac = getZodiacSign(birthDate);

  return `Знак зодиака пользователя: ${zodiac}
Дата рождения: ${birthDate}
Дата запроса: ${todayStr}

Твоя роль: Ты — астролог, видящий влияние звезд и планет на земные события.

Ответ должен содержать:

⭐ АСТРОЛОГИЧЕСКИЙ ФОН (1-2 фразы):
Какие планеты сейчас в движении? Что происходит на небе? (Луна в огненном знаке, Меркурий прямой, аспекты Венеры и т.д.)

🔮 ВЛИЯНИЕ НА ЗНАК (2-3 фразы):
Как это конкретно влияет на ${zodiac}? Какая энергия приходит?

💕 ЛЮБОВЬ — конкретный прогноз для ${zodiac}
💰 ДЕНЬГИ — возможности и риски

💫 ФИНАЛЬНЫЙ СОВЕТ (1-2 фразы):
Как лучше всего использовать эту энергию?

Тон: астролог, чувствующий вибрации звёзд. Лирический, но конкретный. Без общих фраз вроде "будьте осторожны".

ХАРАКТЕРИСТИКИ ЗНАКОВ:
- ОВЕН: Огонь, лидер, импульсивный, боец
- ТЕЛЕЦ: Земля, надежный, консервативный, чувственный
- БЛИЗНЕЦЫ: Воздух, коммуникативный, непостоянный, умный
- РАК: Вода, эмоциональный, семейный, интуитивный
- ЛЕВ: Огонь, гордый, творческий, лидер
- ДЕВА: Земля, практичный, аналитический, перфекционист
- ВЕСЫ: Воздух, гармоничный, дипломат, эстет
- СКОРПИОН: Вода, глубокий, страстный, магнетический
- СТРЕЛЕЦ: Огонь, оптимист, философ, путешественник
- КОЗЕРОГ: Земля, амбициозный, трудолюбивый, серьезный
- ВОДОЛЕЙ: Воздух, независимый, инновативный, интеллектуальный
- РЫБЫ: Вода, мечтательный, чувствительный, творческий`;
}

// ─── Dream interpretation (Сонник) ───────────────────────────────────────────

export function buildDreamPrompt(dreamText: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Сон пользователя: "${dreamText}"

Твоя роль: Ты — психоаналитик и мистик одновременно. Ты видишь в снах не просто галлюцинации, а послания.

🌙 КЛЮЧЕВЫЕ СИМВОЛЫ:
Выдели предметы, людей, места, действия, которые повторяются или выделяются в сне.

🔑 СИМВОЛИЧЕСКОЕ ЗНАЧЕНИЕ (для каждого символа):
Что это может означать? Предложи интерпретацию, привязанную к контексту ЭТОГО сна.

⚡ ЭМОЦИОНАЛЬНЫЙ КОНТЕКСТ:
Какие чувства были в сне? Это ключ к разгадке. Страх, радость, беспокойство?

🔮 ПОСЛАНИЕ БЕССОЗНАТЕЛЬНОГО (2-3 фразы):
О чём подсознание пытается сказать? Что оно требует понимания?

💫 ПРАКТИЧЕСКИЙ СОВЕТ:
Что делать с этой информацией?

Тон: глубокий психолог, говорящий о самом интимном. Уважительный, любопытный, не осуждающий.

ОБЩИЕ СИМВОЛЫ:
- Дом: личность, внутренний мир, безопасность
- Вода: эмоции, подсознание, текущие перемены
- Полёт: свобода, трансцендентность, избегание проблем
- Падение: потеря контроля, страх, неуверенность
- Преследование: избегание чего-то в жизни, внутренний конфликт
- Смерть: трансформация, завершение, новое начало (не буквальная!)
- Животные: инстинкты, энергия, качества животного
- Потеря зубов: перемены, тревога о внешности, власти`;
}

// ─── Compatibility (по знаку зодиака) ────────────────────────────────────────

export function buildCompatibilityPrompt(
  person1: { name: string; birthDate?: string },
  person2: { name: string; birthDate?: string },
  locale: 'ru' | 'uk' | 'en',
): string {
  const z1 = person1.birthDate ? getZodiacSign(person1.birthDate) : '?';
  const z2 = person2.birthDate ? getZodiacSign(person2.birthDate) : '?';

  return `Первый партнер: ${person1.name}${person1.birthDate ? ` (${person1.birthDate}, ${z1})` : ''}
Второй партнер: ${person2.name}${person2.birthDate ? ` (${person2.birthDate}, ${z2})` : ''}

Твоя роль: Ты — астролог, видящий в звёздах историю двух людей.

🔥 СТИХИИ И ПРИРОДА (1-2 фразы):
Какие стихии в паре? Совместимы ли они природой?

💕 СИЛЬНЫЕ СТОРОНЫ (2-3 фразы):
Что их объединяет? Где они дополняют друг друга?

⚡ ВЫЗОВЫ И КОНФЛИКТЫ (2-3 фразы):
Где могут быть трения? Что нужно понимать, чтобы избежать конфликтов?

🔮 ПРОГНОЗ (1-2 фразы):
Долгосрочная перспектива? Возможна ли гармония?

💫 СОВЕТ ЗВЁЗД (1-2 фразы):
Что нужно делать, чтобы отношения процветали?

Тон: мудрец, видящий в звёздах судьбу двоих. Не говори, что вместе плохо — предложи пути к гармонии.

СТИХИИ И СОВМЕСТИМОСТЬ:
- Огонь + Огонь: Страстно, горячо, но может быть бурно
- Огонь + Воздух: Отличная совместимость, взаимное вдохновение
- Огонь + Вода: Натяжение, разные темпы
- Огонь + Земля: Огонь может спалить, или земля потушить
- Воздух + Воздух: Умные, лёгкие отношения
- Вода + Вода: Глубокие эмоциональные связи
- Вода + Земля: Сильная, стабильная пара
- Земля + Земля: Практичная, надежная пара`;
}

// ─── Angel Numbers (Ангельские числа) ────────────────────────────────────────

export function buildAngelNumberPrompt(number: string, locale: 'ru' | 'uk' | 'en'): string {
  return `Число/комбинация, которую видит пользователь: ${number}

Твоя роль: Ты — посредник между человеком и высшими силами, интерпретирующий их послания.

✨ ДУХОВНОЕ ЗНАЧЕНИЕ (1-2 фразы):
Что означает это число в нумерологии и ангельских посланиях?

🔮 ПОСЛАНИЕ (2-3 фразы):
О чём говорит это число? Какой совет дают высшие силы?

🌟 КОНТЕКСТ ЖИЗНИ (1-2 фразы):
Где это число может появиться в жизни? На что обратить внимание?

💫 ДЕЙСТВИЕ (1 фраза):
Что делать с этим посланием?

Тон: ангел, говорящий человеческим языком. Мягкий, поддерживающий, но чёткий.

ОСНОВНЫЕ АНГЕЛЬСКИЕ ЧИСЛА:
- 111: Начало, новый цикл, воплощение мыслей в реальность
- 222: Баланс, гармония, доверие процессу
- 333: Защита ангелов, творческая энергия, духовный рост
- 444: Поддержка, стабильность, ангелы работают
- 555: Перемены, трансформация, новые возможности
- 666: Баланс материального и духовного, земные дела
- 777: Духовное пробуждение, синхронизация, путь выбран правильно
- 888: Изобилие, материальный успех, благодарение
- 999: Завершение цикла, подготовка к новому началу
- 1111: Выравнивание, пробуждение, духовное озарение
- 1212: Баланс мужского и женского начала
- 12:34: Последовательный прогресс, всё идёт по плану`;
}

// ─── Runes (Руны) ────────────────────────────────────────────────────────────

export function buildRunesPrompt(
  cards: { name: string; reversed: boolean }[],
  question?: string,
  locale?: 'ru' | 'uk' | 'en',
): string {
  const runesDesc = cards.map((c, i) => {
    const rev = c.reversed ? ' (перевёрнута)' : '';
    return `Руна ${i + 1}: ${c.name}${rev}`;
  }).join('\n');

  return `Вытянутые руны:
${runesDesc}
Вопрос пользователя: ${question || 'общий вопрос'}

Твоя роль: Ты — шаман, говорящий языком древних символов.

Для каждой руны:

⚡ ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ (1-2 фразы):
Какая энергия в этой руне? Какой архетип?

🔮 ТОЛКОВАНИЕ НА ВОПРОС (2-3 фразы):
Как эта руна отвечает на конкретный вопрос?

Затем:

💫 СОВЕТ ДРЕВНИХ (1-2 фразы):
Что нужно понять или сделать? Какое общее послание всех рун вместе?

Тон: древний, уважительный к силам природы. Практический, как совет старейшины.

ОСНОВНЫЕ РУНЫ:
- Феху: Богатство, материальные ресурсы, достаток
- Уруз: Сила, мощь, здоровье, энергия жизни
- Турисаз: Врата, конфликт, вызов, выбор
- Ансуз: Общение, знания, божественное послание
- Райдо: Путешествие, движение, ритм, справедливость
- Кеназ: Огонь, творчество, трансформация, освещение
- Гебо: Дар, обмен, партнёрство, гармония
- Вуньо: Радость, удача, внутренняя гармония
- Хагалаз: Град, разрушение, очистка, испытание
- Наутиз: Необходимость, урок, ограничение, нужда
- Иса: Лёд, замораживание, застой, интроспекция
- Йера: Год, урожай, циклы, результаты труда
- Эйваз: Тис, врата между мирами, трансформация
- Перт: Тайна, женское начало, инициация
- Альгиз: Защита, боги, священное
- Соулу: Солнце, успех, воля, ясность
- Тивац: Война, честь, правосудие
- Беркана: Берёза, плодородие, рост, материнство
- Эваз: Лошадь, движение, союз, прогресс
- Манназ: Человечество, я, ум, культура
- Лагуз: Вода, интуиция, женское начало
- Ингваз: Плодородие, семя, интеграция
- Дагаз: День, пробуждение, прорыв, новое сознание
- Отала: Отчизна, наследство, собственность, род`;
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

// ─── Natal Chart (натальная карта) ───────────────────────────────────────────

export function buildNatalChartPrompt(natalData: string, locale: 'ru' | 'uk' | 'en'): string {
  const lang = locale === 'uk' ? 'украинском' : locale === 'en' ? 'английском' : 'русском';
  return `ДАННЫЕ НАТАЛЬНОЙ КАРТЫ (рассчитаны программно — используй ТОЛЬКО их):
${natalData}

РОЛЬ: Опытный астролог-аналитик. Индивидуальная консультация, НЕ гороскоп из журнала.
ЯЗЫК: Пиши на ${lang}. Допустимы: MC, ASC, IC, DC.

СТИЛЬ:
— Описательный, НЕ директивный. Без «ты должен», «старайся», «не позволяй». Пиши как наблюдатель портрета.
— Теневые качества = скрытая сила (без осуждения).
— Используй ТОЛЬКО данные из расчёта, ничего не выдумывай.
— Каждый раздел — НОВАЯ информация, не повтор предыдущих.
— Ретрограды = внутренняя фокусировка (не проблема).

СТРУКТУРА (каждый раздел — содержательный, с конкретными примерами поведения):

🌟 БОЛЬШАЯ ТРОЙКА — Солнце, Луна, Асцендент:
Каждый элемент: как проявляется в жизни (привычки, реакции), слепая зона (описательно). Затем СИНТЕЗ — как три элемента работают вместе и где создают трение.

🪐 ПЛАНЕТЫ — Меркурий (мышление), Венера (любовь), Марс (воля), Юпитер (удача), Сатурн (испытания):
Каждая через сферу жизни: знак + дом + аспекты = цельная картина. Уран/Нептун/Плутон — кратко через дом.

⚡ АСПЕКТЫ — 5-7 самых важных: какие силы встречаются, конкретная ситуация, чем полезна динамика.

🔥 СТИХИИ — Точные числа из данных (из 10 планет). Конкретный анализ пропорций и нехватки.

🌙 КАРМА — Северный/Южный Узлы: откуда идёшь → куда движешься. Лилит: зона магнетизма и скрытого потенциала.

🏠 КАРЬЕРА — MC + 10-й дом → конкретные профессии/ниши (не абстракции).

💝 ОТНОШЕНИЯ — 7-й дом + Венера/Луна → портрет партнёра, повторяющийся паттерн.

🎯 ИНТЕГРАЦИЯ — 3-4 сильные стороны, 3-4 точки роста (с привязкой к карте).

✨ ПОРТРЕТ — Финальный абзац: уникальная суть человека, свежий взгляд на карту целиком.`;
}
