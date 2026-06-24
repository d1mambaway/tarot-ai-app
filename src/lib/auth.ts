/**
 * Auth middleware for API routes.
 *
 * Centralizes Telegram initData validation + auth_date expiry check,
 * removing duplicated validateInitData calls from every route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from './telegram';

/** Max age for initData auth_date (5 minutes) */
const AUTH_DATE_MAX_AGE_S = 5 * 60;

export interface AuthUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export interface AuthenticatedRequest {
  request: NextRequest;
  user: AuthUser;
  initData: string;
  locale: 'ru' | 'uk' | 'en';
}

/**
 * Validate initData from request body and return authenticated user.
 * Returns null with error response if validation fails.
 */
export function authenticateRequest(
  initData: string | undefined | null,
): { user: AuthUser; locale: 'ru' | 'uk' | 'en' } | NextResponse {
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const { valid, data } = validateInitData(initData);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
  }

  // Check auth_date expiry — prevents replay attacks
  const authDate = parseInt(data.auth_date || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (authDate > 0 && now - authDate > AUTH_DATE_MAX_AGE_S) {
    return NextResponse.json({ error: 'Auth expired' }, { status: 401 });
  }

  if (!data.user) {
    return NextResponse.json({ error: 'No user data' }, { status: 401 });
  }

  let user: AuthUser;
  try {
    user = JSON.parse(data.user);
  } catch {
    return NextResponse.json({ error: 'Invalid user data' }, { status: 401 });
  }

  const langCode = user.languageCode;
  const locale: 'ru' | 'uk' | 'en' =
    langCode === 'uk' ? 'uk' :
    langCode === 'ru' || langCode === 'be' ? 'ru' :
    'en';

  return { user, locale };
}
