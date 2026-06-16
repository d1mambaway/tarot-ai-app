/**
 * POST /api/user — Register or login user from Mini App
 * Returns user data including mana balance from DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInitData } from '@/lib/telegram';
import { updateStreak, processReferral } from '@/lib/user-limits';

type Locale = 'ru' | 'uk' | 'en';

function detectLocale(langCode?: string): Locale {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru';
  return 'en';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, telegramId, firstName, username, languageCode } = body;

    if (initData) {
      const { valid } = validateInitData(initData);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid init data' }, { status: 401 });
      }
    }

    const locale = detectLocale(languageCode);

    let user = await db.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { subscription: true, cardCollection: true },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          telegramId: BigInt(telegramId),
          username,
          firstName,
          locale,
          mana: 200, // first-launch bonus
        },
        include: { subscription: true, cardCollection: true },
      });

      // Process referral
      const startParam = body.startParam;
      if (startParam?.startsWith('ref_')) {
        const refId = BigInt(startParam.replace('ref_', ''));
        await processReferral(user.id, refId);
      }
    } else {
      await db.user.update({
        where: { id: user.id },
        data: { username, firstName, locale },
      });
    }

    // Update streak
    const streak = await updateStreak(user.id);

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
      mana: user.mana,
      isAdmin: user.isAdmin,
      channelSubBonus: user.channelSubBonus,
      cardCollection: user.cardCollection.map((c) => c.cardId),
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
