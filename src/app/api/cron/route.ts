/**
 * GET /api/cron — Daily cron job (Vercel Cron, 12:00 UTC)
 *
 * 1. Sends "Card of the Day is ready!" push to all users via Telegram bot
 * 2. Resets daily card_of_day flags so everyone can draw again
 *
 * Protected by CRON_SECRET to prevent unauthorized calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/telegram';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel hobby max

// ─── Notification messages ───────────────────────────────────────────────────

type Locale = 'ru' | 'uk' | 'en';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'cardsofmagic_bot';

const DAILY_MSG: Record<Locale, string> = {
  ru: '🌅 <b>Новая Карта Дня готова!</b>\n\n✨ Звёзды обновились — узнай, что тебя ждёт сегодня.\nТвоё бесплатное ежедневное послание от карт уже доступно!',
  uk: '🌅 <b>Нова Карта Дня готова!</b>\n\n✨ Зірки оновились — дізнайся, що тебе чекає сьогодні.\nТвоє безкоштовне щоденне послання від карт вже доступне!',
  en: '🌅 <b>New Card of the Day is ready!</b>\n\n✨ The stars have aligned — discover what awaits you today.\nYour free daily card reading is available!',
};

const OPEN_BTN: Record<Locale, string> = {
  ru: '🔮 Открыть Таро',
  uk: '🔮 Відкрити Таро',
  en: '🔮 Open Tarot',
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Reset daily free reads for all users
    await db.user.updateMany({
      data: {
        freeReadsToday: 0,
        freeReadsReset: new Date(),
      },
    });

    // 2. Get all users to notify
    const users = await db.user.findMany({
      select: {
        telegramId: true,
        locale: true,
      },
    });

    // 3. Send notifications in batches (TG rate limit: ~30 msg/sec)
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const locale = (['ru', 'uk', 'en'].includes(user.locale) ? user.locale : 'ru') as Locale;

      try {
        await sendMessage(user.telegramId.toString(), DAILY_MSG[locale], {
          reply_markup: {
            inline_keyboard: [[
              {
                text: OPEN_BTN[locale],
                web_app: { url: APP_URL },
              },
            ]],
          },
        });
        sent++;
      } catch {
        failed++;
      }

      // Rate limiting: pause every 25 messages for 1 second
      if ((i + 1) % 25 === 0) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    return NextResponse.json({
      ok: true,
      totalUsers: users.length,
      sent,
      failed,
      resetAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Cron failed', details: String(error) },
      { status: 500 },
    );
  }
}
