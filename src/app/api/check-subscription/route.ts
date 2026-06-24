/**
 * POST /api/check-subscription — Check if user is subscribed to @cardsofmagic channel
 * If subscribed and bonus not yet claimed → credits 1000 mana in DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHANNEL_USERNAME = '@cardsofmagic';
const CHANNEL_BONUS_MANA = 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telegramId, initData } = body;

    // Validate initData if provided (prevents unauthenticated bonus claims)
    if (initData) {
      const authResult = authenticateRequest(initData);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    if (!telegramId) {
      return NextResponse.json({ subscribed: false, error: 'No telegramId' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_USERNAME}&user_id=${telegramId}`,
    );
    const data = await res.json();

    if (data.ok) {
      const status = data.result?.status;
      // member, administrator, creator = subscribed
      const subscribed = ['member', 'administrator', 'creator'].includes(status);

      if (subscribed) {
        // Credit mana if not already claimed
        const user = await db.user.findUnique({
          where: { telegramId: BigInt(telegramId) },
        });

        if (user && !user.channelSubBonus) {
          const updated = await db.user.update({
            where: { id: user.id },
            data: {
              channelSubBonus: true,
              mana: { increment: CHANNEL_BONUS_MANA },
            },
          });
          return NextResponse.json({
            subscribed: true,
            bonusClaimed: true,
            manaAdded: CHANNEL_BONUS_MANA,
            newMana: updated.mana,
          });
        }

        return NextResponse.json({
          subscribed: true,
          bonusClaimed: false,
          newMana: user?.mana ?? 0,
        });
      }

      return NextResponse.json({ subscribed: false });
    }

    // Bot might not be admin in channel yet — be lenient
    console.error('getChatMember error:', data);
    return NextResponse.json({ subscribed: false, error: data.description });
  } catch (error: any) {
    console.error('check-subscription error:', error);
    return NextResponse.json({ subscribed: false, error: error.message }, { status: 500 });
  }
}
