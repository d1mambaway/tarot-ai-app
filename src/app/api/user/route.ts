/**
 * POST /api/user — Register or login user from Mini App
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInitData } from '@/lib/telegram';
import { updateStreak, processReferral } from '@/lib/user-limits';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, telegramId, firstName, username, languageCode } = body;

    // Validate Telegram init data
    if (initData) {
      const { valid } = validateInitData(initData);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid init data' }, { status: 401 });
      }
    }

    // Upsert user
    const locale = languageCode === 'uk' ? 'uk' : 'ru';

    let user = await db.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { subscription: true, cardCollection: true },
    });

    if (!user) {
      // New user
      user = await db.user.create({
        data: {
          telegramId: BigInt(telegramId),
          username,
          firstName,
          locale,
        },
        include: { subscription: true, cardCollection: true },
      });

      // Process referral if ref param exists
      const startParam = body.startParam;
      if (startParam?.startsWith('ref_')) {
        const refId = BigInt(startParam.replace('ref_', ''));
        await processReferral(user.id, refId);
      }
    } else {
      // Update existing
      await db.user.update({
        where: { id: user.id },
        data: { username, firstName },
      });
    }

    // Update streak
    const streak = await updateStreak(user.id);

    // Get subscription status
    const subStatus =
      user.subscription?.status === 'ACTIVE' && user.subscription.expiresAt > new Date()
        ? user.subscription.plan
        : 'none';

    return NextResponse.json({
      id: user.id,
      locale: user.locale,
      subscription: subStatus,
      streakDays: streak.streakDays,
      bonusEarned: streak.bonusEarned,
      freeReadsLeft: user.freeReadsToday,
      bonusReads: user.bonusReads,
      cardCollection: user.cardCollection.map((c) => c.cardId),
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
