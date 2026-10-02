/**
 * POST /api/app/delete { initData } — deletes the Android app account and
 * everything stored for it (Google Play requires in-app account deletion).
 * Only app accounts (negative ids) can be deleted here, never Telegram ones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { isAppUserId } from '@/lib/app-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();
    const auth = authenticateRequest(initData);
    if (auth instanceof NextResponse) return auth;
    if (!isAppUserId(auth.user.id)) {
      return NextResponse.json({ error: 'Only app accounts can be deleted here' }, { status: 403 });
    }

    const user = await db.user.findUnique({ where: { telegramId: BigInt(auth.user.id) }, select: { id: true } });
    if (user) {
      await db.$transaction([
        db.reading.deleteMany({ where: { userId: user.id } }),
        db.cardCollection.deleteMany({ where: { userId: user.id } }),
        db.subscription.deleteMany({ where: { userId: user.id } }),
        db.referral.deleteMany({ where: { OR: [{ referrerId: user.id }, { referredId: user.id }] } }),
        db.payment.updateMany({ where: { userId: user.id }, data: { userId: null } }),
        db.user.delete({ where: { id: user.id } }),
      ]);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('App delete error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
