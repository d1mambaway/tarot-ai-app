/**
 * GET /api/setup-bot — One-time bot setup: set menu button text
 * Call once to update the bot's menu button from "Таро" to "🔮"
 */

import { NextResponse } from 'next/server';
import { tgApi } from '@/lib/telegram';

export async function GET() {
  try {
    // Set the default menu button for the bot (the web_app button at bottom of chat)
    const result = await tgApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🔮',
        web_app: { url: process.env.NEXT_PUBLIC_APP_URL! },
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
