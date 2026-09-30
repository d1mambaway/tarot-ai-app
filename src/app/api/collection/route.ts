/**
 * GET /api/collection?initData=… — collected cards with how many times each
 * was drawn and when it was first unlocked (card sheet).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = authenticateRequest(req.nextUrl.searchParams.get('initData') || '');
    if (authResult instanceof NextResponse) return authResult;

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const cards = await db.cardCollection.findMany({
      where: { userId: user.id },
      select: { cardId: true, timesDrawn: true, unlockedAt: true },
    });

    return NextResponse.json({
      cards: cards.map((c) => ({ id: c.cardId, times: c.timesDrawn, at: c.unlockedAt.toISOString() })),
    });
  } catch (error) {
    console.error('Collection API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
