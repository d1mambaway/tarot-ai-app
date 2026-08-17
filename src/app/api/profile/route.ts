/**
 * POST /api/profile — save personalization settings (display name + gender + language)
 *
 * Gender is used purely for grammatical agreement in readings: Russian and
 * Ukrainian inflect past-tense verbs and adjectives by gender, so without it
 * the oracle guesses and half the audience is addressed in the wrong form.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rate-limit';

const ALLOWED_GENDERS = ['female', 'male', 'neutral'] as const;
const ALLOWED_LOCALES = ['ru', 'uk', 'en'] as const;
const MAX_NAME_LENGTH = 32;

/** Trim, collapse whitespace and strip control chars from a user-supplied name */
function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, gender, displayName, locale } = body;

    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    const rl = await checkRateLimit(getUserRateLimitKey(authResult.user.id, 'profile'), 20);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Both fields are optional on their own, but an empty request is a no-op
    if (gender !== undefined && !ALLOWED_GENDERS.includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }
    if (locale !== undefined && !ALLOWED_LOCALES.includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }
    if (gender === undefined && locale === undefined && displayName === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const name = sanitizeName(displayName);

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(gender !== undefined ? { gender } : {}),
        // Empty name is allowed — we then keep falling back to the Telegram first name
        ...(name ? { displayName: name } : {}),
        // localeManual stops /api/user from overwriting the choice with Telegram's language on every launch
        ...(locale !== undefined ? { locale, localeManual: true } : {}),
      },
      select: { gender: true, displayName: true, firstName: true, locale: true },
    });

    return NextResponse.json({
      ok: true,
      gender: updated.gender,
      displayName: updated.displayName,
      firstName: updated.firstName,
      locale: updated.locale,
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
