/**
 * POST /api/app/login { idToken, deviceKey?, lang? } — the Android app's
 * Google / email sign-in. Checks the Firebase ID token and returns a session
 * (initData) for the account. The first time an account signs in on a
 * device that was used without signing in, that device's balance, readings
 * and collection move to the account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appAccountId, appInitDataFor, appUserId, DEVICE_KEY_RE } from '@/lib/app-session';
import { verifyFirebaseIdToken } from '@/lib/firebase-auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(getRateLimitKey(req, 'app-login'), 20);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { idToken, deviceKey, lang } = await req.json();
    const who = await verifyFirebaseIdToken(String(idToken || ''));
    if (!who) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const accountId = appAccountId(who.uid);
    const accountTg = BigInt(accountId);

    // Carry the guest device's progress over to a brand-new account
    if (typeof deviceKey === 'string' && DEVICE_KEY_RE.test(deviceKey)) {
      const deviceTg = BigInt(appUserId(deviceKey));
      const existing = await db.user.findUnique({ where: { telegramId: accountTg }, select: { id: true } });
      if (!existing) {
        await db.user.updateMany({ where: { telegramId: deviceTg }, data: { telegramId: accountTg } });
      }
    }

    const name = who.name || (who.email ? who.email.split('@')[0] : undefined);
    const { initData } = appInitDataFor(accountId, { name, lang: typeof lang === 'string' ? lang : undefined });
    return NextResponse.json({ initData, email: who.email ?? null, name: name ?? null });
  } catch (error) {
    console.error('App login error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
