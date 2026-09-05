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

const BOT_DESCRIPTION: Record<'' | 'ru' | 'uk' | 'en', string> = {
  '': '🔮 Magic of Tarot for those seeking answers. Every card is a key to understanding your future. 🌙',
  ru: '🔮 Магия Таро для тех, кто ищет ответы. Каждая карта — ключ к пониманию вашего будущего. 🌙',
  uk: '🔮 Магія Таро для тих, хто шукає відповіді. Кожна карта є ключем до розуміння вашого майбутнього. 🌙',
  en: '🔮 Magic of Tarot for those seeking answers. Every card is a key to understanding your future. 🌙',
};

export async function GET() {
  try {
    // Set the default menu button for the bot (the web_app button at bottom of chat)
    const menuButtonResult = await tgApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🔮',
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
        tgApi('setMyShortDescription', { short_description: BOT_DESCRIPTION[lang], language_code }),
      ]);
      localeResults[lang || 'default'] = { name: nameRes, description: descRes, shortDescription: shortDescRes };
    }

    return NextResponse.json({ ok: true, menuButtonResult, localeResults });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
