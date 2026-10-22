/**
 * GET /api/card-of-day — Check if user already drew today's card
 * POST /api/card-of-day — Draw today's card (or return existing one)
 *
 * Card resets at 6:00 UTC daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { callGrok, buildTarotSystemPrompt, buildReadingPrompt, buildUserMemoryContext } from '@/lib/ai';
import { drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';
import { authenticateRequest } from '@/lib/auth';
import { recordDraws } from '@/lib/collection';

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

type DbUser = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>;
type DrawnCard = ReturnType<typeof drawCards>[number];

/** The AI interpretation of a card of the day */
async function interpret(user: DbUser, cards: DrawnCard[]): Promise<string> {
  const spread = getSpreadById('card_of_day')!;
  const locale = user.locale as 'ru' | 'uk' | 'en';
  const memoryContext = await buildUserMemoryContext(user.id, locale);
  const systemPrompt = buildTarotSystemPrompt(locale, memoryContext, {
    name: user.displayName || user.firstName,
    gender: user.gender,
  });
  const userPrompt = buildReadingPrompt({
    spreadId: 'card_of_day',
    spreadType: spread.name[locale],
    cards: cards.map((c) => ({
      name: c.name[locale],
      reversed: c.reversed,
      position: undefined,
      keywords: c.reversed ? c.reversedKeywords[locale] : c.keywords[locale],
    })),
    locale,
  });
  return callGrok([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
}

/**
 * A card of the day saved without a text (the AI once answered empty) is
 * re-interpreted for the same card instead of leaving the user with a blank
 * screen until tomorrow.
 */
async function withInterpretation<T extends { id: string; cards: unknown; interpretation: string | null }>(
  user: DbUser, reading: T,
): Promise<T> {
  if (reading.interpretation?.trim()) return reading;
  try {
    const interpretation = await interpret(user, reading.cards as DrawnCard[]);
    await db.reading.update({ where: { id: reading.id }, data: { interpretation } });
    return { ...reading, interpretation };
  } catch (e) {
    console.error('Card of day: re-interpreting an empty reading failed:', e);
    return reading;
  }
}

/** Returns the DB user plus the validated Telegram id, or null if initData is bad/expired. */
async function getUser(initData: string) {
  const authResult = authenticateRequest(initData);
  if (authResult instanceof NextResponse) return null;
  const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
  return user ? { user, telegramId: authResult.user.id } : null;
}

// GET — Check if today's card exists
export async function GET(req: NextRequest) {
  try {
    const initData = req.nextUrl.searchParams.get('initData') || '';
    const auth = await getUser(initData);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { user } = auth;

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
      const fixed = await withInterpretation(user, existing);
      return NextResponse.json({
        exists: true,
        reading: {
          id: existing.id,
          spreadId: 'card_of_day',
          cards: fixed.cards,
          interpretation: fixed.interpretation,
          createdAt: fixed.createdAt.toISOString(),
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
    const body = await req.json();
    const { initData } = body;

    const auth = await getUser(initData);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { user } = auth;

    // Rate limit per Telegram user, not per IP
    const rl = await checkRateLimit(getUserRateLimitKey(auth.telegramId, 'card-of-day'), 15);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

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
      const fixed = await withInterpretation(user, existing);
      return NextResponse.json({
        id: fixed.id,
        spreadId: 'card_of_day',
        cards: fixed.cards,
        interpretation: fixed.interpretation,
        createdAt: fixed.createdAt.toISOString(),
        alreadyDrawn: true,
        nextReset: getNextReset(),
      });
    }

    // Generate new card of the day
    const locale = user.locale as 'ru' | 'uk' | 'en';
    const drawnCards = drawCards(1);
    const interpretation = await interpret(user, drawnCards);

    // Two taps (or two open tabs) used to create two cards of the day. The AI
    // call stays outside the transaction; the re-check + insert run under a
    // per-user advisory lock, so the loser returns the winner's card.
    const outcome = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'cotd:' + user.id}))`;
      const winner = await tx.reading.findFirst({
        where: { userId: user.id, type: 'CARD_OF_DAY', createdAt: { gte: dayStart } },
        orderBy: { createdAt: 'desc' },
      });
      if (winner) return { existing: winner };
      const created = await tx.reading.create({
        data: {
          userId: user.id,
          type: 'CARD_OF_DAY',
          cards: drawnCards as any,
          interpretation,
          locale,
          manaCost: 0,
        },
      });
      return { created };
    });

    if ('existing' in outcome && outcome.existing) {
      const e = outcome.existing;
      return NextResponse.json({
        id: e.id,
        spreadId: 'card_of_day',
        cards: e.cards,
        interpretation: e.interpretation,
        createdAt: e.createdAt.toISOString(),
        alreadyDrawn: true,
        nextReset: getNextReset(),
      });
    }
    const reading = outcome.created!;

    // The card of the day also goes into the Grimoire (it used to be the only
    // way of drawing a card that did not unlock it)
    await recordDraws(user.id, [drawnCards[0].id]).catch((e) => console.warn('cotd collection unlock failed:', e));

    return NextResponse.json({
      id: reading.id,
      spreadId: 'card_of_day',
      cards: drawnCards,
      interpretation,
      createdAt: reading.createdAt.toISOString(),
      alreadyDrawn: false,
      nextReset: getNextReset(),
      newCardsUnlocked: [drawnCards[0].id],
    });
  } catch (error: any) {
    console.error('Card of day POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
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
