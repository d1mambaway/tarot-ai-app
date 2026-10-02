/**
 * POST /api/app/session { deviceKey, name?, lang? } — sign-in for the
 * standalone Android app. Returns a Telegram-format initData (valid 24 h,
 * the app refreshes it) for the device's own account. See lib/app-session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { appInitData, DEVICE_KEY_RE } from '@/lib/app-session';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(getRateLimitKey(req, 'app-session'), 30);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { deviceKey, name, lang } = await req.json();
    if (typeof deviceKey !== 'string' || !DEVICE_KEY_RE.test(deviceKey)) {
      return NextResponse.json({ error: 'Invalid device key' }, { status: 400 });
    }
    const { initData } = appInitData(deviceKey, {
      name: typeof name === 'string' ? name : undefined,
      lang: typeof lang === 'string' ? lang : undefined,
    });
    return NextResponse.json({ initData });
  } catch (error) {
    console.error('App session error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
