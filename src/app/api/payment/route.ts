/**
 * POST /api/payment — Create Stars invoice link for in-app payment
 * Returns an invoice URL that the Mini App opens via WebApp.openInvoice()
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { createInvoiceLink } from '@/lib/telegram';
import { authenticateRequest } from '@/lib/auth';
import { PREMIUM_PLANS, type PremiumPlanId } from '@/lib/premium';

// Oракулы pack definitions.
//
// Star prices are set 1⭐ under Telegram's own in-app top-up bundles
// (250 / 500 / 1000 / 2500 ⭐) — 249/499/999/2499 reads as cheaper than the
// round number while the buyer still ends up topping up to the full bundle
// anyway, stranding a single star. 499/999/2499 also match the Premium plan
// prices below, so the same numbers are recognizable across the whole shop.
//
// Курс растёт с размером пака (база — 3 оракула/⭐ на самом дешёвом паке),
// поэтому у бонуса есть реальное экономическое основание. Верхний пак
// специально не задран выше 2499⭐ — это та же цена, что и годовой Premium,
// который при этом даёт настоящий безлимит + эксклюзивный расклад "Кельтский
// крест". Так сравнение "разово или подписка" выглядит честно, и активному
// пользователю премиум объективно выгоднее, а не потому что паки специально
// накручены.
const MANA_PACKS: Record<string, { mana: number; stars: number; label: string; description: string }> = {
  pack_249:  { mana: 750,   stars: 249,  label: '750 оракулов',   description: '750 оракулов для раскладов' },
  pack_499:  { mana: 1750,  stars: 499,  label: '1750 оракулов',  description: '1750 оракулов для раскладов (+16% к базовому курсу)' },
  pack_999:  { mana: 4000,  stars: 999,  label: '4000 оракулов',  description: '4000 оракулов для раскладов (+33% к базовому курсу)' },
  pack_2499: { mana: 11000, stars: 2499, label: '11000 оракулов', description: '11000 оракулов для раскладов (+46% к базовому курсу)' },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, packId } = body;

    // Auth — shared helper, includes the auth_date freshness check
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;
    const tgUser = authResult.user;

    // Rate limit: 5 requests per minute per Telegram user (not per IP —
    // mobile carriers NAT many users behind one address)
    const rl = await checkRateLimit(`payment:${tgUser.id}`, 5);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check if it's a premium plan
    if (packId in PREMIUM_PLANS) {
      const plan = PREMIUM_PLANS[packId as PremiumPlanId];
      const invoiceUrl = await createInvoiceLink({
        title: `👑 Premium — ${plan.label.ru}`,
        description: `Безлимитный доступ ко всем функциям на ${plan.label.ru}`,
        payload: JSON.stringify({ type: 'premium', planId: packId, months: plan.months, userId: tgUser.id }),
        amount: plan.stars,
      });
      return NextResponse.json({ ok: true, invoiceUrl, stars: plan.stars, type: 'premium' });
    }

    // Mana pack
    const pack = MANA_PACKS[packId];
    if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

    // Create invoice link for in-app payment
    const invoiceUrl = await createInvoiceLink({
      title: pack.label,
      description: pack.description,
      payload: JSON.stringify({ type: 'mana_pack', packId, mana: pack.mana, userId: tgUser.id }),
      amount: pack.stars,
    });

    return NextResponse.json({ ok: true, invoiceUrl, stars: pack.stars, mana: pack.mana });
  } catch (error: any) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
