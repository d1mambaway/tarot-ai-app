/**
 * POST /api/payment — Create Stars invoice link for in-app payment
 * Returns an invoice URL that the Mini App opens via WebApp.openInvoice()
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { createInvoiceLink } from '@/lib/telegram';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { GIFT_PREFIX, MANA_PACKS, PREMIUM_PLANS, STARTER_OFFER, starterOfferAvailable, type PremiumPlanId } from '@/lib/shop';

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
    if (typeof packId === 'string' && Object.prototype.hasOwnProperty.call(PREMIUM_PLANS, packId)) {
      const plan = PREMIUM_PLANS[packId as PremiumPlanId];
      const invoiceUrl = await createInvoiceLink({
        title: `👑 Premium — ${plan.label.ru}`,
        description: `Безлимитный доступ ко всем функциям на ${plan.label.ru}`,
        payload: JSON.stringify({ type: 'premium', planId: packId, userId: tgUser.id }),
        amount: plan.stars,
      });
      return NextResponse.json({ ok: true, invoiceUrl, stars: plan.stars, type: 'premium' });
    }

    // Premium as a gift: the buyer gets a one-time link in the bot chat
    if (typeof packId === 'string' && packId.startsWith(GIFT_PREFIX)) {
      const planId = packId.slice(GIFT_PREFIX.length);
      if (!Object.prototype.hasOwnProperty.call(PREMIUM_PLANS, planId)) {
        return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
      }
      const plan = PREMIUM_PLANS[planId as PremiumPlanId];
      const invoiceUrl = await createInvoiceLink({
        title: `🎁 Premium в подарок — ${plan.label.ru}`,
        description: `Ссылка-подарок придёт в чат с ботом. Друг откроет её и получит Premium на ${plan.label.ru}`,
        payload: JSON.stringify({ type: 'gift', planId, userId: tgUser.id }),
        amount: plan.stars,
      });
      return NextResponse.json({ ok: true, invoiceUrl, stars: plan.stars, type: 'gift' });
    }

    // Starter offer: once per user, first 48 h only (re-checked at pre_checkout)
    if (packId === STARTER_OFFER.id) {
      const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
      const bought = await db.payment.count({
        where: { telegramId: BigInt(tgUser.id), itemId: STARTER_OFFER.id, status: 'completed' },
      });
      if (!user || !starterOfferAvailable(user.createdAt, bought > 0)) {
        return NextResponse.json({ error: 'Offer expired' }, { status: 410 });
      }
      const invoiceUrl = await createInvoiceLink({
        title: STARTER_OFFER.label,
        description: STARTER_OFFER.description,
        payload: JSON.stringify({ type: 'mana_pack', packId, userId: tgUser.id }),
        amount: STARTER_OFFER.stars,
      });
      return NextResponse.json({ ok: true, invoiceUrl, stars: STARTER_OFFER.stars, mana: STARTER_OFFER.mana });
    }

    // Mana pack
    const pack = Object.prototype.hasOwnProperty.call(MANA_PACKS, packId) ? MANA_PACKS[packId] : undefined;
    if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

    // Create invoice link for in-app payment
    const invoiceUrl = await createInvoiceLink({
      title: pack.label,
      description: pack.description,
      payload: JSON.stringify({ type: 'mana_pack', packId, userId: tgUser.id }),
      amount: pack.stars,
    });

    return NextResponse.json({ ok: true, invoiceUrl, stars: pack.stars, mana: pack.mana });
  } catch (error: any) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
