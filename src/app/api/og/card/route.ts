/**
 * GET /api/og/card — AI-иллюстрация карты Таро для поста "карта дня" в
 * Telegram-канале Магия Карт. Рисует Hugging Face Inference API (модель
 * FLUX.1-schnell, бесплатно, без биллинга) по описанию карты, каждый раз
 * заново — не переиспользует низкокачественные ассеты из приложения.
 *
 * Gemini рассматривался, но генерация картинок там требует включённого
 * биллинга даже на "бесплатном" тарифе (квота 0 без него) — HF даёт
 * реальную бесплатную генерацию.
 *
 * Если HF недоступен (модель "прогревается", нет ключа, ошибка сети) —
 * отдаёт 302 на надёжный векторный шаблон /api/og/channel, чтобы автопост
 * никогда не оставался вообще без картинки.
 *
 * Query: name (название карты), keywords (через запятую)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HF_MODEL = 'black-forest-labs/FLUX.1-schnell';
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

function fallbackResponse(req: NextRequest, name: string): NextResponse {
  const url = new URL('/api/og/channel', req.url);
  url.searchParams.set('title', 'Карта дня');
  url.searchParams.set('subtitle', name);
  url.searchParams.set('symbol', '🃏');
  return NextResponse.redirect(url);
}

function buildPrompt(name: string, keywords: string): string {
  return (
    `Mystical tarot card illustration of "${name}" (${keywords}). ` +
    'Dark atmosphere, golden accents, art nouveau style, highly detailed digital painting, ' +
    'vertical 4:5 composition, cinematic lighting, no text, no letters, no card frame, no watermark.'
  );
}

async function requestImage(apiKey: string, prompt: string): Promise<Response> {
  return fetch(HF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
    signal: AbortSignal.timeout(50_000),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Аркан';
  const keywords = searchParams.get('keywords') || '';
  const debug = searchParams.get('debug') === '1';
  const apiKey = process.env.HF_API_KEY;

  if (!apiKey) {
    console.error('og/card: HF_API_KEY не задан, откат на шаблон');
    if (debug) return NextResponse.json({ stage: 'no_key' });
    return fallbackResponse(req, name);
  }

  const prompt = buildPrompt(name, keywords);

  try {
    let res = await requestImage(apiKey, prompt);

    // Модель "холодная" — HF просит подождать и повторить (даже с
    // wait_for_model иногда отдаёт 503 при самом первом обращении).
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 4000));
      res = await requestImage(apiKey, prompt);
    }

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok || !contentType.startsWith('image/')) {
      const text = await res.text().catch(() => '');
      console.error('og/card: HF не вернул картинку', res.status, contentType, text.slice(0, 500));
      if (debug) {
        return NextResponse.json({ stage: 'hf_error', status: res.status, contentType, text: text.slice(0, 1000) });
      }
      return fallbackResponse(req, name);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (e) {
    console.error('og/card: исключение при обращении к Hugging Face', e);
    if (debug) {
      const err = e as Error & { cause?: unknown };
      return NextResponse.json({
        stage: 'exception',
        error: String(e),
        message: err?.message,
        cause: err?.cause ? String(err.cause) : undefined,
        causeDetail: err?.cause ? JSON.stringify(err.cause, Object.getOwnPropertyNames(err.cause as object)) : undefined,
      });
    }
    return fallbackResponse(req, name);
  }
}
