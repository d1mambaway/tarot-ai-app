/**
 * POST /api/reading/image { initData, readingId } — the illustration for a
 * reading that was just made. The reading itself answers right away; the
 * picture (Cloudflare FLUX, can take 15-30 s) is fetched separately so it
 * never holds up the text.
 *
 * Only the reading's owner, only within 15 minutes of the reading, and once
 * per reading (rate limit), so this is not a free image generator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rate-limit';
import { buildImagePrompt, generateImage } from '@/lib/ai/image';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FRESH_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { initData, readingId } = await req.json();
    const auth = authenticateRequest(initData);
    if (auth instanceof NextResponse) return auth;
    if (typeof readingId !== 'string' || !readingId) {
      return NextResponse.json({ error: 'readingId is required' }, { status: 400 });
    }

    const perUser = await checkRateLimit(getUserRateLimitKey(auth.user.id, 'reading-image'), 6);
    if (!perUser.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const reading = await db.reading.findFirst({
      where: { id: readingId, user: { telegramId: BigInt(auth.user.id) } },
      select: { id: true, type: true, cards: true, question: true, createdAt: true },
    });
    if (!reading) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (Date.now() - reading.createdAt.getTime() > FRESH_MS) {
      return NextResponse.json({ image: null });
    }

    // One picture per reading
    const once = await checkRateLimit(`reading-image:${reading.id}`, 1, FRESH_MS);
    if (!once.allowed) return NextResponse.json({ error: 'Already generated' }, { status: 429 });

    const spreadId = reading.type.toLowerCase();
    const cards = Array.isArray(reading.cards)
      ? (reading.cards as { name?: unknown; reversed?: unknown }[]).map((c) => ({ name: String(c?.name ?? ''), reversed: Boolean(c?.reversed) }))
      : [];
    const prompt = buildImagePrompt({
      spreadId,
      cards,
      question: reading.question ?? undefined,
      extraContext: spreadId === 'numerology' ? reading.question ?? undefined : spreadId === 'natal_chart' ? 'natal birth chart' : undefined,
    });
    if (!prompt) return NextResponse.json({ image: null });

    const image = await generateImage(prompt, 768, 512, 50_000);
    return NextResponse.json({ image });
  } catch (error) {
    console.error('Reading image error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
