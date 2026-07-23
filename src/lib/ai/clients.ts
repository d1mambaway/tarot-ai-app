/**
 * AI API clients: Groq, OpenRouter, Pollinations
 * Handles retries, rate limits, timeouts, and output sanitization
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
// llama-3.3-70b-versatile was deprecated by Groq (decommissioned 2026-08-16);
// openai/gpt-oss-120b is Groq's recommended replacement.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

// ─── Output sanitization ─────────────────────────────────────────────────────

/**
 * Strip stray CJK / Arabic / Thai / Devanagari characters that multilingual
 * LLMs sometimes inject into Cyrillic / Latin text.
 * Keeps: Latin, Cyrillic, digits, punctuation, emoji, whitespace.
 */
export function sanitizeLLMOutput(text: string): string {
  return text
    .replace(/[\u2E80-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF\u0600-\u06FF\u0E00-\u0E7F\u0900-\u097F]+/g, '')
    .replace(/(?<=[\u0400-\u04FF\s,.])\b(?!(?:MC|ASC|IC|DC|AI|I{1,3}|IV|VI{0,3}|IX|X{1,3}I{0,2}|XII)\b)[a-zA-Z]{3,}\b/g, '')
    .replace(/  +/g, ' ')
    .trim();
}

// ─── Error classes ───────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Parse retry-after seconds from Groq 429 body, default 30s */
function parseRetryAfter(body: string): number {
  const match = body.match(/try again in (\d+\.?\d*)/i);
  const seconds = match ? Math.ceil(parseFloat(match[1])) : 30;
  return (seconds + 2) * 1000;
}

function isRateLimitError(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('rate_limit') || lower.includes('tokens_per_minute');
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

// ─── Groq API ────────────────────────────────────────────────────────────────

export async function callGrok(messages: Message[], maxTokens = 2000): Promise<string> {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 90_000;

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
        console.error('Groq request timed out');
        throw new GrokServiceError();
      }
      throw fetchErr;
    }
    clearTimeout(timer);

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(await response.text());
      if (attempt < MAX_RETRIES - 1 && retryAfter <= 65_000) {
        await sleep(retryAfter);
        continue;
      }
      throw new GrokRateLimitError();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error (attempt ${attempt + 1}/${MAX_RETRIES}): ${response.status} — ${errorText}`);
      if (isRateLimitError(errorText)) {
        const retryAfter = parseRetryAfter(errorText);
        if (attempt < MAX_RETRIES - 1 && retryAfter <= 65_000) {
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

// ─── OpenRouter API ──────────────────────────────────────────────────────────

export async function callOpenRouter(messages: Message[], maxTokens = 4000): Promise<string> {
  const TIMEOUT_MS = 120_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.85,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} — ${errorText}`);
      throw new GrokServiceError();
    }

    const data = (await response.json()) as GrokResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new GrokServiceError();

    console.log(`OpenRouter usage: ${data.usage?.prompt_tokens}in/${data.usage?.completion_tokens}out`);
    return content.trim();
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      console.error('OpenRouter request timed out');
      throw new GrokServiceError();
    }
    if (err instanceof GrokRateLimitError || err instanceof GrokServiceError) throw err;
    throw new GrokServiceError();
  }
}

// ─── Groq JSON mode ─────────────────────────────────────────────────────────

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
      if (isRateLimitError(errorText)) {
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
