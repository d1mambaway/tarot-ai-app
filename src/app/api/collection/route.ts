/**
 * GET /api/collection?initData=…&deck=<id> — collected cards of one deck with
 * how many times each was drawn and when it was first unlocked (card sheet).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { DECKS, getDeck } from '@/data/decks';

export async function GET(req: NextRequest) {
  try {
    const authResult = authenticateRequest(req.nextUrl.searchParams.get('initData') || '');
    if (authResult instanceof NextResponse) return authResult;

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const asked = req.nextUrl.searchParams.get('deck');
    const deckId = DECKS.some((d) => d.id === asked) ? asked! : getDeck(user.deckId).id;

    const [cards, perDeck] = await Promise.all([
      db.cardCollection.findMany({
        where: { userId: user.id, deckId },
        select: { cardId: true, timesDrawn: true, unlockedAt: true },
      }),
      db.cardCollection.groupBy({ by: ['deckId'], where: { userId: user.id }, _count: { _all: true } }),
    ]);

    return NextResponse.json({
      deckId,
      activeDeckId: getDeck(user.deckId).id,
      cards: cards.map((c) => ({ id: c.cardId, times: c.timesDrawn, at: c.unlockedAt.toISOString() })),
      counts: Object.fromEntries(perDeck.map((d) => [d.deckId, d._count._all])),
    });
  } catch (error) {
    console.error('Collection API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
