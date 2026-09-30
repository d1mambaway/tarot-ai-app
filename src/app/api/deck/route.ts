/**
 * POST /api/deck — make a deck the user's active one (its art is used in
 * readings and the card of the day from now on).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { isSelectableDeck } from '@/data/decks';

export async function POST(req: NextRequest) {
  try {
    const { initData, deckId } = await req.json();
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    if (!isSelectableDeck(deckId)) {
      return NextResponse.json({ error: 'Deck not available' }, { status: 400 });
    }
    await db.user.update({ where: { telegramId: BigInt(authResult.user.id) }, data: { deckId } });
    return NextResponse.json({ ok: true, deckId });
  } catch (error) {
    console.error('Deck API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
