/**
 * POST /api/user — Register or login user from Mini App
 * Returns user data including mana balance from DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInitData, sendMessage } from '@/lib/telegram';
import { AUTH_DATE_MAX_AGE_S } from '@/lib/auth';
import { updateStreak, applyStartParam, REFERRAL_NOTICE } from '@/lib/user-limits';
import { checkPremium } from '@/lib/premium';
import { STARTER_OFFER, starterOfferAvailable } from '@/lib/shop';
import { PREMIUM_BIG_REPORT_DAYS } from '@/data/spreads';
import { getDeck } from '@/data/decks';

type Locale = 'ru' | 'uk' | 'en';

function detectLocale(langCode?: string): Locale {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru';
  return 'en';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, languageCode } = body;

    // Identity comes only from Telegram-signed initData: without it anyone
    // could read (or create) any user's profile by posting a telegramId
    if (!initData) {
      return NextResponse.json({ error: 'Missing init data' }, { status: 401 });
    }
    const { valid, data } = validateInitData(initData);
    if (!valid || !data.user) {
      return NextResponse.json({ error: 'Invalid init data' }, { status: 401 });
    }
    const authDate = parseInt(data.auth_date || '0', 10);
    if (authDate > 0 && Math.floor(Date.now() / 1000) - authDate > AUTH_DATE_MAX_AGE_S) {
      return NextResponse.json({ error: 'Auth expired' }, { status: 401 });
    }
    let tgUser: { id: number; first_name?: string; username?: string; language_code?: string };
    try {
      tgUser = JSON.parse(data.user);
    } catch {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 401 });
    }
    if (!tgUser?.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 401 });
    }
    const telegramId = tgUser.id;
    const firstName = tgUser.first_name ?? body.firstName;
    const username = tgUser.username ?? body.username;
    const langCode: string | undefined = tgUser.language_code ?? languageCode;

    const locale = detectLocale(langCode);

    let user = await db.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { subscription: true, cardCollection: true },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          telegramId: BigInt(telegramId),
          username,
          firstName,
          locale,
          mana: 200, // first-launch bonus
          firstReadingFree: true,
        },
        include: { subscription: true, cardCollection: true },
      });

      // Deep link (t.me/<bot>/<app>?startapp=…): referral or acquisition source.
      // Only the Telegram-signed start_param is trusted, never the request body.
      const { referrer } = await applyStartParam(user.id, data.start_param);
      if (referrer) {
        const rl = (['ru', 'uk', 'en'].includes(referrer.locale) ? referrer.locale : 'ru') as Locale;
        await sendMessage(referrer.telegramId.toString(), REFERRAL_NOTICE[rl]).catch(() => {});
      }
    } else {
      await db.user.update({
        where: { id: user.id },
        // Never overwrite a language the user picked by hand in the profile
        data: { username, firstName, ...(user.localeManual ? {} : { locale }) },
      });
    }

    // Update daily check-in streak
    const checkIn = await updateStreak(user.id);

    // Get referral count
    const referralCount = await db.referral.count({
      where: { referrerId: user.id },
    });

    // Reload user to get updated mana after streak bonus
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
    });

    const subStatus =
      user.subscription?.status === 'ACTIVE' && user.subscription.expiresAt > new Date()
        ? user.subscription.plan
        : 'none';

    // Check premium status
    const premiumStatus = await checkPremium(user.id);

    const [starterBought, readingsCount] = await Promise.all([
      db.payment.count({ where: { telegramId: BigInt(telegramId), itemId: STARTER_OFFER.id, status: 'completed' } }),
      db.reading.count({ where: { userId: user.id } }),
    ]);
    const starterAvailable = !premiumStatus.isPremium && starterOfferAvailable(user.createdAt, starterBought > 0);

    return NextResponse.json({
      id: user.id,
      locale: user.locale,
      subscription: subStatus,
      isPremium: premiumStatus.isPremium,
      premiumExpiresAt: premiumStatus.expiresAt?.toISOString() || null,
      premiumDaysLeft: premiumStatus.daysLeft,
      streakDays: checkIn.streakDays,
      checkedInToday: checkIn.checkedInToday,
      checkInManaAwarded: checkIn.manaAwarded,
      referralCount,
      firstName: freshUser?.firstName ?? user.firstName,
      displayName: freshUser?.displayName ?? user.displayName,
      gender: freshUser?.gender ?? user.gender,
      birthDate: (freshUser?.birthDate ?? user.birthDate)?.toISOString().slice(0, 10) ?? null,
      zodiacSign: freshUser?.zodiacSign ?? user.zodiacSign,
      freeReadsLeft: user.freeReadsToday,
      bonusReads: user.bonusReads,
      mana: freshUser?.mana ?? user.mana,
      isAdmin: user.isAdmin,
      channelSubBonus: user.channelSubBonus,
      // Collection of the active deck (the Grimoire shows per-deck details via /api/collection)
      deckId: getDeck(user.deckId).id,
      cardCollection: user.cardCollection.filter((c) => c.deckId === getDeck(user.deckId).id).map((c) => c.cardId),
      firstReadingFree: freshUser?.firstReadingFree ?? false,
      premiumSaved: freshUser?.premiumSaved ?? 0,
      premiumBigReportAvailable:
        premiumStatus.isPremium &&
        (!freshUser?.premiumBigReportAt ||
          Date.now() - freshUser.premiumBigReportAt.getTime() >= PREMIUM_BIG_REPORT_DAYS * 86400_000),
      starterOfferEndsAt: starterAvailable
        ? new Date(user.createdAt.getTime() + STARTER_OFFER.windowHours * 3600_000).toISOString()
        : null,
      achievementsClaimed: freshUser?.achievementsClaimed ?? [],
      readingsCount,
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
