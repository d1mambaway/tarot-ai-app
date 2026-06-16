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
      temperature: 0.85, // creative but not chaotic
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

export function buildTarotSystemPrompt(locale: 'ru' | 'uk'): string {
  const lang = locale === 'uk' ? 'українською мовою' : 'на русском языке';
  
  return `Ты — мистический AI-таролог. Ты даёшь глубокие, персональные интерпретации карт Таро.

ПРАВИЛА:
- Отвечай ТОЛЬКО ${lang}
- Стиль: мистический, глубокий, но понятный. Не сухой, не академический
- Каждая интерпретация должна чувствоваться ЛИЧНОЙ, как будто ты видишь конкретного человека
- Используй метафоры, образы, поэтичность — но без воды
- Если карта перевёрнута, это НЕ всегда негатив — это нюанс, тень основного значения
- В конце каждого расклада — конкретный совет, что ДЕЛАТЬ
- НЕ упоминай что ты AI, нейросеть или программа. Ты — таролог, оракул
- Форматируй текст для удобного чтения (абзацы, эмодзи уместно)`;
}

export function buildReadingPrompt(params: {
  spreadType: string;
  cards: { name: string; reversed: boolean; position?: string }[];
  question?: string;
  locale: 'ru' | 'uk';
}): string {
  const { spreadType, cards, question, locale } = params;
  
  const cardsDesc = cards
    .map((c, i) => {
      const pos = c.position ? `[${c.position}] ` : `[Карта ${i + 1}] `;
      const rev = c.reversed ? ' (перевёрнута)' : '';
      return `${pos}${c.name}${rev}`;
    })
    .join('\n');

  let prompt = `Тип расклада: ${spreadType}\n\nВыпавшие карты:\n${cardsDesc}`;
  
  if (question) {
    prompt += `\n\nВопрос пользователя: "${question}"`;
  }

  prompt += `\n\nДай глубокую интерпретацию. Сначала — общее впечатление от расклада, потом — каждая карта в контексте позиции, потом — итог и совет.`;

  return prompt;
}

// ─── Specialized prompts for non-tarot readings ─────────────────────────────

export function buildDreamPrompt(dreamText: string, locale: 'ru' | 'uk'): string {
  return `Пользователь описал свой сон: "${dreamText}"

Проанализируй символы сна. Дай интерпретацию:
1. Ключевые символы и их значение
2. Общее послание сна
3. Связь с текущей жизненной ситуацией
4. Совет на основе сна`;
}

export function buildNumerologyPrompt(name: string, birthDate: string, locale: 'ru' | 'uk'): string {
  return `Имя: ${name}
Дата рождения: ${birthDate}

Сделай нумерологический анализ:
1. Число жизненного пути
2. Число имени  
3. Число души
4. Общая характеристика личности
5. Прогноз на текущий период
6. Совет`;
}

export function buildCompatibilityPrompt(
  person1: { name: string; birthDate?: string },
  person2: { name: string; birthDate?: string },
  locale: 'ru' | 'uk',
): string {
  return `Анализ совместимости:
Человек 1: ${person1.name}${person1.birthDate ? `, дата рождения: ${person1.birthDate}` : ''}
Человек 2: ${person2.name}${person2.birthDate ? `, дата рождения: ${person2.birthDate}` : ''}

Дай детальный разбор:
1. Процент совместимости (число)
2. Сильные стороны пары
3. Возможные конфликты
4. Сексуальная совместимость
5. Долгосрочный прогноз
6. Совет для пары`;
}

export function buildPsychPortraitPrompt(answers: string[], locale: 'ru' | 'uk'): string {
  return `На основе ответов пользователя составь глубокий психологический портрет.

Ответы:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Дай шокирующе точный анализ:
1. Тип личности
2. Главная сила
3. Главная слабость / теневая сторона
4. Что ты скрываешь от других
5. Чего на самом деле хочешь
6. Совет`;
}
