/**
 * GET /api/card-of-day — Check if user already drew today's card
 * POST /api/card-of-day — Draw today's card (or return existing one)
 *
 * Card resets at 6:00 UTC daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { callGrok, buildTarotSystemPrompt, buildReadingPrompt } from '@/lib/ai';
import { drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';
import { validateInitData } from '@/lib/telegram';

/** Get today's "card day" boundary — resets at 6:00 UTC */
function getCardDayStart(): Date {
  const now = new Date();
  const boundary = new Date(now);
  boundary.setUTCHours(6, 0, 0, 0);

  // If before 6:00 UTC today, the current "day" started yesterday at 6:00 UTC
  if (now < boundary) {
    boundary.setUTCDate(boundary.getUTCDate() - 1);
  }

  return boundary;
}

async function getUser(initData: string) {
  const { valid, data: tgData } = validateInitData(initData);
  if (!valid) return null;
  const tgUser = JSON.parse(tgData.user);
  return db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
}

// GET — Check if today's card exists
export async function GET(req: NextRequest) {
  try {
    const initData = req.nextUrl.searchParams.get('initData') || '';
    const user = await getUser(initData);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dayStart = getCardDayStart();

    const existing = await db.reading.findFirst({
      where: {
        userId: user.id,
        type: 'CARD_OF_DAY',
        createdAt: { gte: dayStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return NextResponse.json({
        exists: true,
        reading: {
          id: existing.id,
          spreadId: 'card_of_day',
          cards: existing.cards,
          interpretation: existing.interpretation,
          createdAt: existing.createdAt.toISOString(),
        },
        nextReset: getNextReset(),
      });
    }

    return NextResponse.json({
      exists: false,
      nextReset: getNextReset(),
    });
  } catch (error: any) {
    console.error('Card of day GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST — Draw today's card (or return existing)
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 15 requests per minute per IP
    const rl = await checkRateLimit(getRateLimitKey(req, 'card-of-day'), 15);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { initData } = body;

    const user = await getUser(initData);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dayStart = getCardDayStart();

    // Check if already drawn today
    const existing = await db.reading.findFirst({
      where: {
        userId: user.id,
        type: 'CARD_OF_DAY',
        createdAt: { gte: dayStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        spreadId: 'card_of_day',
        cards: existing.cards,
        interpretation: existing.interpretation,
        createdAt: existing.createdAt.toISOString(),
        alreadyDrawn: true,
        nextReset: getNextReset(),
      });
    }

    // Generate new card of the day
    const spread = getSpreadById('card_of_day')!;
    const locale = user.locale as 'ru' | 'uk' | 'en';
    const drawnCards = drawCards(1);

    const systemPrompt = buildTarotSystemPrompt(locale);
    const userPrompt = buildReadingPrompt({
      spreadId: 'card_of_day',
      spreadType: spread.name[locale],
      cards: drawnCards.map((c) => ({
        name: c.name[locale],
        reversed: c.reversed,
        position: undefined,
      })),
      locale,
    });

    const interpretation = await callGrok([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const reading = await db.reading.create({
      data: {
        userId: user.id,
        type: 'CARD_OF_DAY',
        cards: drawnCards as any,
        interpretation,
        locale,
        manaCost: 0,
      },
    });

    return NextResponse.json({
      id: reading.id,
      spreadId: 'card_of_day',
      cards: drawnCards,
      interpretation,
      createdAt: reading.createdAt.toISOString(),
      alreadyDrawn: false,
      nextReset: getNextReset(),
    });
  } catch (error: any) {
    console.error('Card of day POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

function getNextReset(): string {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0);
  if (now >= next) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.toISOString();
}
