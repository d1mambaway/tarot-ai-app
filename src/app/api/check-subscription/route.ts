/**
 * POST /api/check-subscription — Check if user is subscribed to @cardsofmagic channel
 */

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHANNEL_USERNAME = '@cardsofmagic';

export async function POST(req: NextRequest) {
  try {
    const { telegramId } = await req.json();
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
      return NextResponse.json({ subscribed });
    }

    // Bot might not be admin in channel yet — be lenient
    console.error('getChatMember error:', data);
    return NextResponse.json({ subscribed: false, error: data.description });
  } catch (error: any) {
    console.error('check-subscription error:', error);
    return NextResponse.json({ subscribed: false, error: error.message }, { status: 500 });
  }
}
