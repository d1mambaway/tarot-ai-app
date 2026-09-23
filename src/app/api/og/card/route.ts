/**
 * GET /api/og/card — AI-иллюстрация карты Таро для поста "карта дня" в
 * Telegram-канале Магия Карт. Рисует Cloudflare Workers AI (модель
 * FLUX.1-schnell, бесплатно — 10000 нейронов/день, этого хватает на ~2000
 * картинок в день без какого-либо биллинга) по описанию карты, каждый раз
 * заново — не переиспользует низкокачественные ассеты из приложения.
 *
 * Изначально использовался Hugging Face Inference API, но её старый
 * бесплатный эндпоинт api-inference.huggingface.co полностью отключён
 * (DNS больше не резолвится) — HF перевела всё на платных провайдеров
 * (fal.ai/replicate) через router.huggingface.co, а FLUX.1-schnell там
 * бесплатно не доступен. Gemini тоже отпал раньше — картинки там требуют
 * включённого биллинга даже на "бесплатном" тарифе (квота 0 без него).
 * Cloudflare Workers AI — единственный вариант с реально бесплатной и
 * щедрой квотой без привязки карты.
 *
 * Если Cloudflare недоступен (нет ключа, ошибка сети, квота) — отдаёт 302
 * на надёжный векторный шаблон /api/og/channel, чтобы автопост никогда не
 * оставался вообще без картинки.
 *
 * Query: name (название карты), keywords (через запятую)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CF_MODEL = '@cf/black-forest-labs/flux-1-schnell';

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

// PNG сигнатура: 89 50 4E 47. Всё остальное (в т.ч. недокументированные
// варианты) отдаём как JPEG — так документирует сам Cloudflare.
function detectContentType(buffer: Buffer): string {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  return 'image/jpeg';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Аркан';
  const keywords = searchParams.get('keywords') || '';
  const debug = searchParams.get('debug') === '1';
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    console.error('og/card: CF_ACCOUNT_ID/CF_API_TOKEN не заданы, откат на шаблон');
    if (debug) return NextResponse.json({ stage: 'no_key' });
    return fallbackResponse(req, name);
  }

  const prompt = buildPrompt(name, keywords);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, steps: 8 }),
      signal: AbortSignal.timeout(50_000),
    });

    const contentType = res.headers.get('content-type') || '';
    let base64Image: string | undefined;

    if (contentType.startsWith('application/json')) {
      const data = (await res.json().catch(() => null)) as
        | { result?: { image?: string }; image?: string; success?: boolean; errors?: unknown }
        | null;
      base64Image = data?.result?.image || data?.image;
      if (!res.ok || !base64Image) {
        console.error('og/card: Cloudflare не вернул картинку', res.status, JSON.stringify(data).slice(0, 500));
        if (debug) return NextResponse.json({ stage: 'cf_error', status: res.status, body: data });
        return fallbackResponse(req, name);
      }
    } else {
      console.error('og/card: неожиданный content-type от Cloudflare', res.status, contentType);
      if (debug) {
        const text = await res.text().catch(() => '');
        return NextResponse.json({ stage: 'cf_unexpected', status: res.status, contentType, text: text.slice(0, 1000) });
      }
      return fallbackResponse(req, name);
    }

    const buffer = Buffer.from(base64Image, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': detectContentType(buffer),
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (e) {
    console.error('og/card: исключение при обращении к Cloudflare Workers AI', e);
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
