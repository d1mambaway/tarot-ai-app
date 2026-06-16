/**
 * POST /api/webhook — Telegram Bot webhook handler
 * Handles /start, payments, and inline queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, answerPreCheckoutQuery, BOT_COMMANDS } from '@/lib/telegram';
import { db } from '@/lib/db';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME!;

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ─── /start command ────────────────────────────────────────────────
    if (update.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const langCode = update.message.from?.language_code;
      const locale = langCode === 'uk' ? 'uk' : 'ru';
      const startParam = update.message.text.split(' ')[1] || '';

      const text = BOT_COMMANDS.start[locale];
      
      await sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: locale === 'uk' ? '🔮 Відкрити Таро' : '🔮 Открыть Таро',
                web_app: { url: `${APP_URL}?startapp=${startParam}` },
              },
            ],
          ],
        },
      });
    }

    // ─── Pre-checkout query (Stars payment) ────────────────────────────
    if (update.pre_checkout_query) {
      // Always approve (can add validation later)
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
    }

    // ─── Successful payment ────────────────────────────────────────────
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const telegramId = BigInt(update.message.from.id);

      // Record payment
      await db.payment.create({
        data: {
          telegramId,
          starsAmount: payment.total_amount,
          itemType: 'reading', // parse from payload
          telegramPayId: payment.telegram_payment_charge_id,
          status: 'completed',
        },
      });

      // Parse payload and fulfill
      try {
        const payload = JSON.parse(payment.invoice_payload);
        
        if (payload.type === 'subscription') {
          // Activate subscription
          const user = await db.user.findUnique({ where: { telegramId } });
          if (user) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            await db.subscription.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                plan: payload.plan,
                expiresAt,
                starsTxId: payment.telegram_payment_charge_id,
              },
              update: {
                plan: payload.plan,
                status: 'ACTIVE',
                expiresAt,
                starsTxId: payment.telegram_payment_charge_id,
              },
            });
          }
        }
      } catch {
        // payload parse error — log but don't fail
        console.error('Failed to parse payment payload');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true }); // always return 200 to Telegram
  }
}
