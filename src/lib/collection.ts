/**
 * Card collection per deck: unlock cards and count how often each was drawn.
 */

import { db } from './db';

/**
 * Record that these cards were drawn in `deckId`. New cards are unlocked,
 * already collected ones get timesDrawn + 1. Returns the ids unlocked now.
 */
export async function recordDraws(userId: string, deckId: string, cardIds: number[]): Promise<number[]> {
  const ids = Array.from(new Set(cardIds));
  if (ids.length === 0) return [];

  const existing = await db.cardCollection.findMany({
    where: { userId, deckId, cardId: { in: ids } },
    select: { cardId: true },
  });
  const have = new Set(existing.map((c) => c.cardId));
  const fresh = ids.filter((id) => !have.has(id));

  if (have.size > 0) {
    await db.cardCollection.updateMany({
      where: { userId, deckId, cardId: { in: Array.from(have) } },
      data: { timesDrawn: { increment: 1 } },
    });
  }
  if (fresh.length > 0) {
    await db.cardCollection.createMany({
      data: fresh.map((cardId) => ({ userId, deckId, cardId })),
      skipDuplicates: true,
    });
  }
  return fresh;
}
