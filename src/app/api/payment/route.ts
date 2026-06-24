/**
 * POST /api/payment — Create Stars invoice link for in-app payment
 * Returns an invoice URL that the Mini App opens via WebApp.openInvoice()
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { createInvoiceLink, validateInitData } from '@/lib/telegram';

// Oракулы pack definitions
const MANA_PACKS: Record<string, { mana: number; stars: number; label: string; description: string }> = {
  pack_500:   { mana: 500,   stars: 5,   label: '500 оракулов',   description: '500 оракулов для раскладов' },
  pack_1500:  { mana: 1500,  stars: 125, label: '1500 оракулов',  description: '1500 оракулов для раскладов' },
  pack_5000:  { mana: 5000,  stars: 350, label: '5000 оракулов',  description: '5000 оракулов для раскладов' },
  pack_15000: { mana: 15000, stars: 750, label: '15000 оракулов', description: '15000 оракулов для раскладов' },
};

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP
    const rl = checkRateLimit(getRateLimitKey(req, 'payment'), 5);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { initData, packId } = body;

    // Validate TG user
    if (!initData) {
      return NextResponse.json({ error: 'No auth' }, { status: 401 });
    }

    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = JSON.parse(tgData.user);

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
