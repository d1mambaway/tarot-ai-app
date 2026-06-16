/**
 * POST /api/payment — Create Stars payment invoice
 * Called from Mini App when user needs to pay for a reading
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStarsInvoice } from '@/lib/telegram';
import { validateInitData } from '@/lib/telegram';
import { getSpreadById, SPREADS } from '@/data/spreads';
import { db } from '@/lib/db';

// Subscription pricing in Stars
const SUBSCRIPTION_PRICES = {
  BASIC: 150,   // ~$3/month
  PREMIUM: 350, // ~$7/month
  VIP: 750,     // ~$15/month
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, type, spreadId, plan } = body;

    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = JSON.parse(tgData.user);
    const chatId = tgUser.id;

    if (type === 'reading') {
      const spread = getSpreadById(spreadId);
      if (!spread) return NextResponse.json({ error: 'Invalid spread' }, { status: 400 });

      await createStarsInvoice({
        chatId,
        title: spread.name.ru, // TODO: use user locale
        description: spread.description.ru,
        payload: JSON.stringify({ type: 'reading', spreadId }),
        amount: spread.starsCost,
      });

      return NextResponse.json({ ok: true, starsCost: spread.starsCost });
    }

    if (type === 'subscription') {
      const price = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES];
      if (!price) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

      const titles = {
        BASIC: { ru: '⭐ Подписка Basic', uk: '⭐ Підписка Basic' },
        PREMIUM: { ru: '💎 Подписка Premium', uk: '💎 Підписка Premium' },
        VIP: { ru: '👑 Подписка VIP', uk: '👑 Підписка VIP' },
      };

      await createStarsInvoice({
        chatId,
        title: titles[plan as keyof typeof titles].ru,
        description: `Безлимитный доступ на 30 дней`,
        payload: JSON.stringify({ type: 'subscription', plan }),
        amount: price,
      });

      return NextResponse.json({ ok: true, starsCost: price });
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
