/**
 * POST /api/support — Send a support message from user to admin via support bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram';
import { db } from '@/lib/db';

const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN!;
const SUPPORT_ADMIN_CHAT_ID = process.env.SUPPORT_ADMIN_CHAT_ID!;

async function supportBotApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { initData, message } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    // Validate user
    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tgUser = JSON.parse(tgData.user);
    const telegramId = tgUser.id;
    const firstName = tgUser.first_name || '';
    const lastName = tgUser.last_name || '';
    const username = tgUser.username || '';

    // Get user from DB for extra context
    const dbUser = await db.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    // Format message for admin
    const adminText = [
      `📩 <b>Обращение в поддержку</b>`,
      ``,
      `👤 <b>${firstName} ${lastName}</b>${username ? ` (@${username})` : ''}`,
      `🆔 <code>${telegramId}</code>`,
      dbUser ? `💎 Мана: ${dbUser.mana} | 🔥 Стрик: ${dbUser.streakDays}` : '',
      ``,
      `💬 <i>${message.trim()}</i>`,
    ].filter(Boolean).join('\n');

    // Send to admin via support bot
    const result = await supportBotApi('sendMessage', {
      chat_id: SUPPORT_ADMIN_CHAT_ID,
      text: adminText,
      parse_mode: 'HTML',
    });

    if (!result.ok) {
      console.error('Support bot error:', result);
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Support error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
