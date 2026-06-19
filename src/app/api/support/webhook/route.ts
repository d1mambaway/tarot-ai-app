/**
 * POST /api/support/webhook — Webhook for support bot
 * When admin replies to a support message, forward the reply to the user via main bot
 */

import { NextRequest, NextResponse } from 'next/server';

const MAIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN!;
const SUPPORT_ADMIN_CHAT_ID = process.env.SUPPORT_ADMIN_CHAT_ID!;

async function mainBotApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${MAIN_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

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
    const update = await req.json();
    const msg = update.message;

    if (!msg || !msg.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(msg.chat.id);

    // Only process messages from admin
    if (chatId !== SUPPORT_ADMIN_CHAT_ID) {
      // If someone else messages the bot, tell them to use the app
      if (msg.text === '/start') {
        await supportBotApi('sendMessage', {
          chat_id: chatId,
          text: '🔮 Для обращения в поддержку используйте приложение Cards of Magic.\n\nОткройте приложение → нажмите 💬 рядом с балансом маны.',
          parse_mode: 'HTML',
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Admin commands
    if (msg.text === '/start') {
      await supportBotApi('sendMessage', {
        chat_id: chatId,
        text: '🛠 <b>Cards of Magic Support Bot</b>\n\nОбращения пользователей будут приходить сюда.\nЧтобы ответить — просто ответьте на сообщение (reply).',
        parse_mode: 'HTML',
      });
      return NextResponse.json({ ok: true });
    }

    // Admin replies to a support message → forward to user
    if (msg.reply_to_message?.text) {
      const originalText = msg.reply_to_message.text;

      // Extract telegram ID from the original message (🆔 <code>123456</code>)
      const idMatch = originalText.match(/🆔\s*(\d+)/);
      if (!idMatch) {
        await supportBotApi('sendMessage', {
          chat_id: chatId,
          text: '⚠️ Не удалось определить ID пользователя из сообщения.',
          reply_to_message_id: msg.message_id,
        });
        return NextResponse.json({ ok: true });
      }

      const userTelegramId = idMatch[1];

      // Send reply to user via main bot
      const replyText = [
        `💬 <b>Ответ от поддержки</b>`,
        ``,
        msg.text,
      ].join('\n');

      const result = await mainBotApi('sendMessage', {
        chat_id: userTelegramId,
        text: replyText,
        parse_mode: 'HTML',
      });

      if (result.ok) {
        await supportBotApi('sendMessage', {
          chat_id: chatId,
          text: `✅ Ответ отправлен пользователю ${userTelegramId}`,
          reply_to_message_id: msg.message_id,
        });
      } else {
        await supportBotApi('sendMessage', {
          chat_id: chatId,
          text: `❌ Ошибка отправки: ${result.description || 'unknown'}`,
          reply_to_message_id: msg.message_id,
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Support webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
