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
      const num = extraContext || '7';
      return `Mystical number ${num} glowing with sacred geometry, cosmic numerology, floating in space among stars, golden light rays, ${style}`;
    }

    case 'runes':
      return `Ancient Norse rune stones glowing with magical energy on a wooden table, Viking mystical atmosphere, northern lights above, ${style}`;

    case 'horoscope':
      return `Zodiac wheel spinning among stars, celestial observatory with planets aligned, astrology mystical scene, cosmic, ${style}`;

    case 'relationship':
    case 'what_they_think':
      return `Two silhouettes facing each other with tarot cards floating between them, emotional energy, ${style}`;

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

// ─── Numerology (Число Судьбы) ───────────────────────────────────────────────

function calculateDestinyNumber(birthDate: string): string {
  const digits = birthDate.replace(/\D/g, '');
  let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
  // Check for master numbers before reducing
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return sum.toString();
}

export function buildNumerologyPrompt(name: string, birthDate: string, locale: 'ru' | 'uk' | 'en'): string {
  const destinyNum = calculateDestinyNumber(birthDate);

  return `Дата рождения пользователя: ${birthDate}
Число Судьбы: ${destinyNum}
${name !== 'Пользователь' ? `Имя: ${name}` : ''}

Твоя роль: Ты — нумеролог, видящий в числах не просто цифры, а энергию, вибрацию, карму.

Ответ должен содержать:

🔮 ДУХОВНОЕ ЗНАЧЕНИЕ ЧИСЛА (1-2 фразы):
Что означает это число в мистической иерархии? Какая энергия в нём живет?

✨ ХАРАКТЕР И ТАЛАНТЫ (2-3 фразы):
Какие черты характера получил человек? Какие таланты? Что ему дается легче всего?

⚡ ЖИЗНЕННАЯ ЗАДАЧА / КАРМИЧЕСКИЙ ДОЛГ (2-3 фразы):
Зачем это число? Что этому человеку нужно понять, развить, преодолеть в этой жизни?

💫 РЕКОМЕНДАЦИЯ (1-2 фразы):
Практический совет: как работать со своим числом? Как гармонизировать?

Тон: мудрец, говорящий о судьбе. Честный, иногда суровый, но всегда справедливый.

ХАРАКТЕРИСТИКИ ЧИСЕЛ:
- 1: Лидер, независимость, инициатива, новаторство
- 2: Гармония, партнёрство, дипломатия, чувствительность
- 3: Творчество, самовыражение, удача, оптимизм
- 4: Труд, стабильность, надежность, структура
- 5: Свобода, перемены, приключения, коммуникация
- 6: Ответственность, служение, семья, любовь
- 7: Духовность, интуиция, мудрость, анализ
- 8: Власть, материальное благополучие, амбиции, контроль
- 9: Завершение, альтруизм, духовность, преобразование
- 11: Интуиция, вдохновение, пророчество, духовная миссия (мастер-число)
- 22: Мастерство, масштабные проекты, воплощение видений (мастер-число)
- 33: Сострадание, исцеление, служение, учительство (мастер-число)`;
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
