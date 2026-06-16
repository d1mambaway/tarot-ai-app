/**
 * POST /api/webhook — Telegram Bot webhook handler
 * Handles /start, mana pack payments, and pre-checkout queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, answerPreCheckoutQuery } from '@/lib/telegram';
import { db } from '@/lib/db';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

type Locale = 'ru' | 'uk' | 'en';

function detectLocale(langCode?: string): Locale {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru'; // be = belarusian → ru
  return 'en';
}

const WELCOME: Record<Locale, string> = {
  ru: '✨ Добро пожаловать в <b>Магию Карт</b>!\nНажми кнопку ниже, чтобы открыть приложение 🔮',
  uk: '✨ Ласкаво просимо до <b>Магії Карт</b>!\nНатисни кнопку нижче, щоб відкрити додаток 🔮',
  en: '✨ Welcome to <b>Magic of Cards</b>!\nTap the button below to open the app 🔮',
};

const OPEN_BTN: Record<Locale, string> = {
  ru: '🔮 Открыть Таро',
  uk: '🔮 Відкрити Таро',
  en: '🔮 Open Tarot',
};

const PAYMENT_THANKS: Record<Locale, string> = {
  ru: '✅ Готово! Мана начислена 💎\nОткрой приложение, чтобы увидеть баланс.',
  uk: '✅ Готово! Мана нарахована 💎\nВідкрий додаток, щоб побачити баланс.',
  en: '✅ Done! Mana credited 💎\nOpen the app to see your balance.',
};

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ─── /start command ────────────────────────────────────────────────
    if (update.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const locale = detectLocale(update.message.from?.language_code);
      const startParam = update.message.text.split(' ')[1] || '';

      await sendMessage(chatId, WELCOME[locale], {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: OPEN_BTN[locale],
                web_app: { url: `${APP_URL}?startapp=${startParam}` },
              },
            ],
          ],
        },
      });

      // Register user in DB (best-effort)
      try {
        const telegramId = BigInt(update.message.from.id);
        await db.user.upsert({
          where: { telegramId },
          create: {
            telegramId,
            username: update.message.from.username,
            firstName: update.message.from.first_name,
            locale,
            mana: 200, // first-launch bonus
          },
          update: {
            username: update.message.from.username,
            firstName: update.message.from.first_name,
          },
        });
      } catch (e) {
        console.error('DB upsert on /start:', e);
      }
    }

    // ─── Pre-checkout query (Stars payment) ────────────────────────────
    if (update.pre_checkout_query) {
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
    }

    // ─── Successful payment → credit mana ──────────────────────────────
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const telegramId = BigInt(update.message.from.id);
      const locale = detectLocale(update.message.from?.language_code);

      try {
        const payload = JSON.parse(payment.invoice_payload);

        if (payload.type === 'mana_pack') {
          const manaAmount = payload.mana || 0;

          // Credit mana to user
          const user = await db.user.upsert({
            where: { telegramId },
            create: {
              telegramId,
              username: update.message.from.username,
              firstName: update.message.from.first_name,
              locale,
              mana: 200 + manaAmount, // first-launch + pack
            },
            update: {
              mana: { increment: manaAmount },
            },
          });

          // Record payment
          await db.payment.create({
            data: {
              telegramId,
              userId: user.id,
              starsAmount: payment.total_amount,
              manaAmount,
              itemType: 'mana_pack',
              itemId: payload.packId,
              telegramPayId: payment.telegram_payment_charge_id,
              status: 'completed',
            },
          });

          // Notify user
          await sendMessage(chatId, PAYMENT_THANKS[locale]);
        }
      } catch (e) {
        console.error('Payment processing error:', e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
