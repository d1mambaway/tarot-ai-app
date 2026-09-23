/**
 * GET /api/channel-post — ежедневный автономный пост в Telegram-канал
 * Магия Карт. Формат ротируется (карта дня / гороскоп / фаза луны /
 * число дня / послание), текст пишет Groq, картинку рисует /api/og/channel
 * (без вотемарок, в честном разрешении — не переиспользует ассеты карт
 * из приложения, у них водяной знак и низкое разрешение для постов).
 *
 * Публикуется полностью автономно, без подтверждения (так попросил Дима).
 * Защищено CRON_SECRET — тем же способом, что и /api/cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGrok, sanitizeLLMOutput } from '@/lib/ai';
import { sendPhoto, sendPhotoBuffer } from '@/lib/telegram';
import { buildTodaysPost, buildPostByType } from '@/lib/channel-poster';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

// Эндпоинт запускает реальное действие (отправку сообщения) при каждом
// обращении — ни в коем случае не должен отдаваться из чьего-либо кэша
// (CDN/edge), иначе повторный вызов молча вернёт старый результат вместо
// того чтобы реально отправить пост.
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

function jsonNoStore(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: NO_STORE_HEADERS });
}

function webhookBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonNoStore({ error: 'Unauthorized' }, { status: 401 });
  }

  const channel = process.env.CHANNEL_CHAT_ID;
  if (!channel) {
    return jsonNoStore({ error: 'CHANNEL_CHAT_ID не задан' }, { status: 500 });
  }

  // ?type=card|horoscope|moon|numerology|tip — ручной запуск конкретного
  // формата (для проверки), в обход обычной дневной ротации.
  const forcedType = request.nextUrl.searchParams.get('type');
  const post = (forcedType && buildPostByType(forcedType)) || buildTodaysPost();

  let body: string;
  try {
    const raw = await callGrok([
      { role: 'system', content: post.systemPrompt },
      { role: 'user', content: post.userPrompt },
    ]);
    body = sanitizeLLMOutput(raw).trim();
    if (!body) throw new Error('пустой ответ');
  } catch (e) {
    console.error('channel-post: Groq generation failed, using fallback text', e);
    body = post.subtitle ? `Сегодняшняя тема: ${post.subtitle}.` : 'Загляни в приложение за подробным раскладом.';
  }
  if (body.length > 700) {
    body = body.slice(0, 700).split(/[.!?]\s/).slice(0, -1).join('. ') + '.';
  }

  const base = webhookBaseUrl();
  let imageUrl: string;
  if (post.type === 'card') {
    const cardParams = new URLSearchParams({
      name: post.subtitle,
      keywords: post.imageKeywords || '',
    });
    imageUrl = `${base}/api/og/card?${cardParams.toString()}`;
  } else {
    const ogParams = new URLSearchParams({
      title: post.title,
      subtitle: post.subtitle,
      symbol: post.symbol,
    });
    imageUrl = `${base}/api/og/channel?${ogParams.toString()}`;
  }

  const botUsername = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'cardsofmagic_bot';
  const headline = post.subtitle ? `<b>${post.title}: ${post.subtitle}</b>` : `<b>${post.title}</b>`;
  const footer = `🔮 <a href="https://t.me/${botUsername}">Наше волшебное приложение</a>`;
  let caption = `${headline}\n\n${body}\n\n${footer}`;
  if (caption.length > 1024) {
    const room = 1024 - headline.length - footer.length - 4; // 4 = два "\n\n"
    caption = `${headline}\n\n${body.slice(0, Math.max(room, 0))}\n\n${footer}`;
  }

  try {
    let result;
    if (post.type === 'card') {
      // Для карты дня не отдаём Telegram ссылку — у него свой короткий
      // таймаут на скачивание файла по URL, и если генерация на нашей
      // стороне (AI-иллюстрация) занимает чуть дольше обычного, он тихо
      // не успевает её забрать. Качаем сами (у функции бюджет 60с) и
      // грузим уже готовые байты.
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(45_000) });
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      result = await sendPhotoBuffer(channel, imgBuffer, 'card.jpg', caption);
    } else {
      result = await sendPhoto(channel, imageUrl, caption);
    }
    if (!result?.ok) {
      console.error('channel-post: sendPhoto failed', result);
      return jsonNoStore({ ok: false, error: result }, { status: 502 });
    }
    return jsonNoStore({
      ok: true,
      type: post.type,
      subtitle: post.subtitle,
      imageUrl,
      messageId: result?.result?.message_id,
      sentAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('channel-post: sendPhoto threw', e);
    return jsonNoStore({ ok: false, error: String(e) }, { status: 502 });
  }
}
