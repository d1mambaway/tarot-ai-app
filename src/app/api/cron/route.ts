/**
 * GET /api/cron — Daily cron job (Vercel Cron, 6:00 UTC)
 *
 * 1. Sends the "card of the day" push to all users via Telegram bot: an
 *    animation (public/ui/card-of-day.mp4) with a caption and a web_app
 *    button, plain text if the animation can't be sent
 * 2. Resets daily card_of_day flags so everyone can draw again
 *
 * Protected by CRON_SECRET to prevent unauthorized calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAnimation, sendMessage, tgApi } from '@/lib/telegram';
import { getSetting, setSetting } from '@/lib/admin-settings';
import { db } from '@/lib/db';
import { cronAuthorized } from '@/lib/secrets';
import { collectDueReminders, markReminderSent } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel hobby max

// ─── Notification messages ───────────────────────────────────────────────────

type Locale = 'ru' | 'uk' | 'en';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'cardsofmagic_bot';

const DAILY_MSG: Record<Locale, string> = {
  ru: '❓ <b>Что скрывает твоя карта дня?</b>\nЗвёзды сменились, колода перетасована ✨\nОтвет уже ждёт, осталось перевернуть 🔮',
  uk: '❓ <b>Що приховує твоя карта дня?</b>\nЗірки змінилися, колоду перетасовано ✨\nВідповідь уже чекає, залишилося перевернути 🔮',
  en: '❓ <b>What is your card of the day hiding?</b>\nThe stars have shifted, the deck is shuffled ✨\nYour answer is waiting, just turn the card 🔮',
};

const OPEN_BTN: Record<Locale, string> = {
  ru: '🪄 Перевернуть карту',
  uk: '🪄 Перевернути карту',
  en: '🪄 Turn the card',
};

// Button on the "come back" reminders about an earlier reading
const REMINDER_BTN: Record<Locale, string> = {
  ru: '🔮 Открыть Таро',
  uk: '🔮 Відкрити Таро',
  en: '🔮 Open Tarot',
};

// The first send uploads the video by URL; Telegram's file_id is then kept
// here and reused for everyone else (and the next days), so the file is
// downloaded once instead of once per user.
const ANIMATION_KEY = 'cotd_animation_file_id';
const ANIMATION_URL = `${APP_URL}/ui/card-of-day.mp4`;
// Give up on the animation for this run after this many failures in a row
// that are not about the user (blocked bot etc.) — e.g. the file is missing
const MAX_ANIMATION_FAILURES = 3;

type TgResult = {
  ok?: boolean;
  error_code?: number;
  description?: string;
  result?: { animation?: { file_id?: string }; document?: { file_id?: string } };
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  if (!cronAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 0. Ensure Telegram webhook points to this deployment
    const webhookBase = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    if (webhookBase) {
      const expectedUrl = `${webhookBase}/api/webhook`;
      // Always re-set the webhook (idempotent on Telegram's side): getWebhookInfo
      // never reveals whether a secret_token is currently registered, so checking
      // only the URL would silently skip re-registering the secret_token whenever
      // it's added/rotated while the URL itself stays the same — which is exactly
      // what caused a prod outage (secret added to TELEGRAM_WEBHOOK_SECRET, but
      // Telegram never got told about it, so it stopped sending the header and
      // every update — not just admin commands — got rejected as Unauthorized).
      await tgApi('setWebhook', {
        url: expectedUrl,
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'successful_payment'],
        ...(process.env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET } : {}),
      });

      // Support bot: same secret, so /api/support/webhook can reject forged
      // updates (it relays admin replies through the MAIN bot to any user)
      if (process.env.SUPPORT_BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${process.env.SUPPORT_BOT_TOKEN}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${webhookBase}/api/support/webhook`,
            allowed_updates: ['message'],
            ...(process.env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET } : {}),
          }),
        }).catch((e) => console.error('support setWebhook failed:', e));
      }
    }

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
    let animationId = await getSetting(ANIMATION_KEY).catch(() => null);
    let animationFailures = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const locale = (['ru', 'uk', 'en'].includes(user.locale) ? user.locale : 'ru') as Locale;
      const chatId = user.telegramId.toString();
      const extra = {
        reply_markup: {
          inline_keyboard: [[{ text: OPEN_BTN[locale], web_app: { url: APP_URL } }]],
        },
      };

      try {
        let res: TgResult | null = null;
        if (animationFailures < MAX_ANIMATION_FAILURES) {
          res = (await sendAnimation(chatId, animationId ?? ANIMATION_URL, DAILY_MSG[locale], extra).catch(() => null)) as TgResult | null;
          if (res?.ok) {
            animationFailures = 0;
            const fileId = res.result?.animation?.file_id ?? res.result?.document?.file_id;
            if (fileId && fileId !== animationId) {
              animationId = fileId;
              await setSetting(ANIMATION_KEY, fileId).catch((e) => console.error('cron: saving animation file_id failed:', e));
            }
          } else if (res?.error_code !== 403) {
            // Not the user's fault: a stale file_id falls back to the URL next
            // time, too many failures switch the rest of the run to text
            animationFailures++;
            console.error('cron: sendAnimation failed:', res?.error_code, res?.description);
            if (animationId && /file/i.test(res?.description || '')) animationId = null;
          }
        }

        if (res?.ok) {
          sent++;
        } else if (res?.error_code === 403) {
          failed++; // blocked the bot: text would fail the same way
        } else {
          const text = (await sendMessage(chatId, DAILY_MSG[locale], extra)) as TgResult;
          if (text?.ok) sent++;
          else failed++;
        }
      } catch {
        failed++;
      }

      // Rate limiting: pause every 25 messages for 1 second
      if ((i + 1) % 25 === 0) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    // 4. Personalized "come back" reminders for readings 3-5 days old with no
    //    follow-up activity since — grounded in the user's own last question,
    //    not a generic push, so it lands where it matters.
    let reminderSent = 0;
    let reminderFailed = 0;
    try {
      const reminders = await collectDueReminders();
      for (const r of reminders) {
        try {
          await sendMessage(r.telegramId.toString(), r.message, {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: REMINDER_BTN[r.locale],
                  web_app: { url: APP_URL },
                },
              ]],
            },
          });
          await markReminderSent(r.readingId);
          reminderSent++;
        } catch (e) {
          console.error('Reminder send failed:', e);
          reminderFailed++;
        }
      }
    } catch (e) {
      console.error('Reminder collection failed:', e);
    }

    return NextResponse.json({
      ok: true,
      totalUsers: users.length,
      sent,
      failed,
      reminderSent,
      reminderFailed,
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
