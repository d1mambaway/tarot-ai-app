/**
 * GET /api/setup-bot — One-time bot setup: menu button + localized bot profile
 * Call once (or after changing the text below) to:
 *  - set the bot's menu button
 *  - set the bot's name/description/short description per Telegram interface
 *    language, via setMyName/setMyDescription/setMyShortDescription
 *
 * Telegram picks the variant matching each user's own interface language
 * automatically — this only needs to run once per change, not per user.
 */

import { NextResponse } from 'next/server';
import { tgApi } from '@/lib/telegram';

// '' is the fallback Telegram shows to users whose language has no dedicated
// entry below (e.g. German, Spanish...). Matches detectLocale()'s own
// fallback elsewhere in the app: unknown language → English, not Russian.
const BOT_NAME: Record<'' | 'ru' | 'uk' | 'en', string> = {
  '': 'Magic of Cards',
  ru: 'Магия Карт',
  uk: 'Магія карт',
  en: 'Magic of Cards',
};

// Shown before the user presses Start (up to 512 characters)
const BOT_DESCRIPTION: Record<'' | 'ru' | 'uk' | 'en', string> = {
  '': "You're not here by chance.\nAsk a question — and the cards will answer.\n\n" +
    'What\'s inside:\n• Tarot spreads on love, choices and the future\n• A card of the day every morning\n' +
    '• Moon calendar and new / full moon spreads\n• Runes, natal chart and destiny matrix\n• «Read me» — a reading about you',
  ru: 'Ты здесь не случайно.\nЗадай вопрос — и карты ответят.\n\n' +
    'Что внутри:\n• Расклады Таро на любовь, выбор и будущее\n• Карта дня каждое утро\n' +
    '• Лунный календарь и расклады на новолуние и полнолуние\n• Руны, натальная карта и матрица судьбы\n• «Прочитай меня» — расклад о тебе',
  uk: 'Ти тут не випадково.\nПостав питання — і карти дадуть відповідь.\n\n' +
    'Що всередині:\n• Розклади Таро на кохання, вибір і майбутнє\n• Карта дня щоранку\n' +
    '• Місячний календар і розклади на молодик та повню\n• Руни, натальна карта й матриця долі\n• «Прочитай мене» — розклад про тебе',
  en: "You're not here by chance.\nAsk a question — and the cards will answer.\n\n" +
    'What\'s inside:\n• Tarot spreads on love, choices and the future\n• A card of the day every morning\n' +
    '• Moon calendar and new / full moon spreads\n• Runes, natal chart and destiny matrix\n• «Read me» — a reading about you',
};

// Bot profile and share previews (up to 120 characters)
const BOT_SHORT_DESCRIPTION: Record<'' | 'ru' | 'uk' | 'en', string> = {
  '': "You're not here by chance. Ask a question — and the cards will answer. Tarot, runes, astrology.",
  ru: 'Ты здесь не случайно. Задай вопрос — и карты ответят. Таро, руны, астрология.',
  uk: 'Ти тут не випадково. Постав питання — і карти дадуть відповідь. Таро, руни, астрологія.',
  en: "You're not here by chance. Ask a question — and the cards will answer. Tarot, runes, astrology.",
};

export async function GET() {
  try {
    // Set the default menu button for the bot (the web_app button at bottom of chat)
    const menuButtonResult = await tgApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Открыть 🪄',
        web_app: { url: process.env.NEXT_PUBLIC_APP_URL! },
      },
    });

    // Localize the bot's profile name/description for every user, based on
    // their own Telegram interface language — no per-user code needed here,
    // Telegram serves the matching variant itself.
    const localeResults: Record<string, unknown> = {};
    for (const lang of Object.keys(BOT_NAME) as Array<keyof typeof BOT_NAME>) {
      const language_code = lang || undefined;
      const [nameRes, descRes, shortDescRes] = await Promise.all([
        tgApi('setMyName', { name: BOT_NAME[lang], language_code }),
        tgApi('setMyDescription', { description: BOT_DESCRIPTION[lang], language_code }),
        tgApi('setMyShortDescription', { short_description: BOT_SHORT_DESCRIPTION[lang], language_code }),
      ]);
      localeResults[lang || 'default'] = { name: nameRes, description: descRes, shortDescription: shortDescRes };
    }

    // Register both webhooks with the secret token right away (the daily cron
    // does the same), so a deploy that turns on secret checks works immediately
    const base = process.env.NEXT_PUBLIC_APP_URL;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const webhooks: Record<string, unknown> = {};
    if (base) {
      webhooks.main = await tgApi('setWebhook', {
        url: `${base}/api/webhook`,
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
        ...(secret ? { secret_token: secret } : {}),
      });
      if (process.env.SUPPORT_BOT_TOKEN) {
        const r = await fetch(`https://api.telegram.org/bot${process.env.SUPPORT_BOT_TOKEN}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${base}/api/support/webhook`,
            allowed_updates: ['message'],
            ...(secret ? { secret_token: secret } : {}),
          }),
        });
        webhooks.support = await r.json();
      }
    }

    return NextResponse.json({ ok: true, menuButtonResult, localeResults, webhooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
