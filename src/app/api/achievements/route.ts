/**
 * POST /api/achievements — claim the reward of an unlocked achievement.
 *
 * Achievements used to show "+300 💎" but nothing was ever credited. The
 * server recomputes the stats from the DB (never trusts the client) and pays
 * each achievement once: the id is pushed to achievementsClaimed in the same
 * conditional UPDATE that adds the mana, so parallel taps cannot pay twice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { getAchievement } from '@/data/achievements';

export async function POST(req: NextRequest) {
  try {
    const { initData, id } = await req.json();
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    const achievement = typeof id === 'string' ? getAchievement(id) : undefined;
    if (!achievement) return NextResponse.json({ error: 'Unknown achievement' }, { status: 400 });

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [readingsCount, cardsCollected, majorCollected] = await Promise.all([
      db.reading.count({ where: { userId: user.id } }),
      // Distinct cards across all decks
      db.cardCollection.groupBy({ by: ['cardId'], where: { userId: user.id } }).then((r) => r.length),
      db.cardCollection.groupBy({ by: ['cardId'], where: { userId: user.id, cardId: { lte: 21 } } }).then((r) => r.length),
    ]);

    if (!achievement.check({ readingsCount, cardsCollected, majorCollected, streakDays: user.streakDays })) {
      return NextResponse.json({ error: 'Not unlocked yet' }, { status: 409 });
    }

    const claimed = await db.user.updateMany({
      where: { id: user.id, NOT: { achievementsClaimed: { has: achievement.id } } },
      data: { achievementsClaimed: { push: achievement.id }, mana: { increment: achievement.reward } },
    });

    const fresh = await db.user.findUnique({
      where: { id: user.id },
      select: { mana: true, achievementsClaimed: true },
    });

    return NextResponse.json({
      ok: true,
      credited: claimed.count === 1 ? achievement.reward : 0,
      newMana: fresh?.mana ?? user.mana,
      achievementsClaimed: fresh?.achievementsClaimed ?? [],
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
