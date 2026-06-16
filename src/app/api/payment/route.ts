/**
 * POST /api/payment — Create Stars invoice for mana packs
 * Called from Mini App shop screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStarsInvoice, validateInitData } from '@/lib/telegram';

// Mana pack definitions
const MANA_PACKS: Record<string, { mana: number; stars: number; label: string }> = {
  pack_500:   { mana: 500,   stars: 50,  label: '✨ 500 Mana' },
  pack_1500:  { mana: 1500,  stars: 125, label: '💫 1500 Mana' },
  pack_5000:  { mana: 5000,  stars: 350, label: '🔮 5000 Mana' },
  pack_15000: { mana: 15000, stars: 750, label: '👑 15000 Mana' },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, packId } = body;

    // Validate TG user
    let chatId: number;
    if (initData) {
      const { valid, data: tgData } = validateInitData(initData);
      if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const tgUser = JSON.parse(tgData.user);
      chatId = tgUser.id;
    } else if (body.chatId) {
      chatId = body.chatId;
    } else {
      return NextResponse.json({ error: 'No auth' }, { status: 401 });
    }

    const pack = MANA_PACKS[packId];
    if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

    // Send Stars invoice to user via bot
    const result = await createStarsInvoice({
      chatId,
      title: pack.label,
      description: `${pack.mana} mana for your readings`,
      payload: JSON.stringify({ type: 'mana_pack', packId, mana: pack.mana }),
      amount: pack.stars,
    });

    return NextResponse.json({ ok: true, stars: pack.stars, mana: pack.mana, result });
  } catch (error: any) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
