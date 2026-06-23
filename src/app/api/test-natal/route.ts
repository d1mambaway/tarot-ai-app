import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

export async function GET() {
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];

  const results: Record<string, any> = {};

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const body = await res.text();

      results[model] = {
        status: res.status,
        headers: {
          'x-ratelimit-limit-tokens': res.headers.get('x-ratelimit-limit-tokens'),
          'x-ratelimit-remaining-tokens': res.headers.get('x-ratelimit-remaining-tokens'),
          'x-ratelimit-limit-requests': res.headers.get('x-ratelimit-limit-requests'),
          'x-ratelimit-remaining-requests': res.headers.get('x-ratelimit-remaining-requests'),
          'retry-after': res.headers.get('retry-after'),
        },
        body: body.substring(0, 500),
      };
    } catch (err: any) {
      results[model] = { error: err.message };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
