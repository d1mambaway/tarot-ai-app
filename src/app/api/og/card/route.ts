/**
 * GET /api/og/card — AI-иллюстрация карты Таро для поста "карта дня" в
 * Telegram-канале Магия Карт. Рисует Cloudflare Workers AI (модель
 * FLUX.2 [klein] 4B, бесплатная дневная квота в 10000 нейронов, без
 * какого-либо биллинга) по описанию карты, каждый раз
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
import { cfGenerateImage } from '@/lib/ai/cloudflare-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function fallbackResponse(req: NextRequest, name: string): NextResponse {
  const url = new URL('/api/og/channel', req.url);
  url.searchParams.set('title', 'Карта дня');
  url.searchParams.set('subtitle', name);
  url.searchParams.set('symbol', '🃏');
  return NextResponse.redirect(url);
}

function buildPrompt(name: string, keywords: string): string {
  return (
    `Detailed fantasy character portrait painting inspired by the tarot archetype "${name}" (${keywords}). ` +
    'Dark mystical atmosphere, golden light accents, painterly digital art, dramatic cinematic lighting, ' +
    'vertical 4:5 composition. Pure illustration, plain edges, no decorative border, no ornamental frame, ' +
    'no card design, no banner, no title plate, no caption, no numbers, no letters, no text, no signature, no watermark.'
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Аркан';
  const keywords = searchParams.get('keywords') || '';
  const debug = searchParams.get('debug') === '1';

  const r = await cfGenerateImage(buildPrompt(name, keywords), { width: 768, height: 960, timeoutMs: 50_000 });
  if (!r.ok) {
    if (r.stage === 'no_key') console.error('og/card: CF_ACCOUNT_ID/CF_API_TOKEN не заданы, откат на шаблон');
    else console.error('og/card: Cloudflare не вернул картинку', r.stage, r.status ?? '', JSON.stringify(r.detail ?? '').slice(0, 500));
    if (debug) return NextResponse.json({ stage: r.stage, status: r.status, body: r.detail });
    return fallbackResponse(req, name);
  }

  return new NextResponse(Buffer.from(r.base64, 'base64'), {
    headers: {
      'Content-Type': r.contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
