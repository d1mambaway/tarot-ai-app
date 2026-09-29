/**
 * POST /api/check-subscription — Check if user is subscribed to @cardsofmagic channel
 * If subscribed and bonus not yet claimed → credits 1000 mana in DB
 *
 * Identity comes only from Telegram-signed initData. Before, initData was
 * optional and the telegramId came from the body, so anyone could claim the
 * bonus for any subscribed account; and the claim was read-then-write, so
 * parallel requests each credited 1000.
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

    const authResult = authenticateRequest(body.initData);
    if (authResult instanceof NextResponse) return authResult;
    const telegramId = authResult.user.id;

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_USERNAME}&user_id=${telegramId}`,
    );
    const data = await res.json();

    if (!data.ok) {
      // Bot might not be admin in channel yet
      console.error('getChatMember error:', data);
      return NextResponse.json({ subscribed: false, error: data.description });
    }

    // member, administrator, creator = subscribed
    const subscribed = ['member', 'administrator', 'creator'].includes(data.result?.status);
    if (!subscribed) return NextResponse.json({ subscribed: false });

    const user = await db.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (!user) return NextResponse.json({ subscribed: true, bonusClaimed: false, newMana: 0 });

    // Atomic claim: only the request that flips the flag gets the bonus
    const claimed = await db.user.updateMany({
      where: { id: user.id, channelSubBonus: false },
      data: { channelSubBonus: true, mana: { increment: CHANNEL_BONUS_MANA } },
    });
    const fresh = await db.user.findUnique({ where: { id: user.id }, select: { mana: true } });

    return NextResponse.json({
      subscribed: true,
      bonusClaimed: claimed.count === 1,
      ...(claimed.count === 1 ? { manaAdded: CHANNEL_BONUS_MANA } : {}),
      newMana: fresh?.mana ?? user.mana,
    });
  } catch (error: any) {
    console.error('check-subscription error:', error);
    return NextResponse.json({ subscribed: false, error: 'Internal error' }, { status: 500 });
  }
}
