/**
 * Free tier & subscription logic
 * Controls who can access what and when
 */

import { db } from './db';
import { kyivDayKey, kyivDayStart, kyivYesterdayKey } from './date';
import { isBigReport, firstFreeEligible, PREMIUM_BIG_REPORT_DAYS, type SpreadConfig } from '@/data/spreads';

export interface AccessResult {
  allowed: boolean;
  reason?: 'free' | 'subscription' | 'premium' | 'bonus' | 'mana' | 'first_free';
  needsPayment?: boolean;
  /** Spread is premium-only and the user has no premium */
  needsPremium?: boolean;
  starsCost?: number;
  freeLeft?: number;
  manaSpent?: number;
  /** What was actually consumed — used to refund if the reading fails */
  consumed?: 'free' | 'bonus' | 'mana' | 'first_free' | 'premium_big';
  /** premium_big only: the value premiumBigReportAt had before, restored on refund */
  prevBigReportAt?: Date | null;
}

export async function checkReadingAccess(
  userId: string,
  spread: SpreadConfig,
): Promise<AccessResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) return { allowed: false, needsPayment: true, starsCost: spread.starsCost };

  const now = new Date();
  const hasSub = user.subscription?.status === 'ACTIVE' && user.subscription.expiresAt > now;
  const isPremium = hasSub && (user.subscription!.plan === 'VIP' || user.subscription!.plan === 'PREMIUM');

  if (isPremium) {
    // Premium is unlimited except for the big reports (natal chart, destiny
    // matrix): one of those per 30 days is included, the next ones cost mana.
    if (!isBigReport(spread)) return { allowed: true, reason: 'premium' };

    const cutoff = new Date(now.getTime() - PREMIUM_BIG_REPORT_DAYS * 86400_000);
    const claimed = await db.user.updateMany({
      where: {
        id: userId,
        OR: [{ premiumBigReportAt: null }, { premiumBigReportAt: { lt: cutoff } }],
      },
      data: { premiumBigReportAt: now },
    });
    if (claimed.count === 1) {
      return { allowed: true, reason: 'premium', consumed: 'premium_big', prevBigReportAt: user.premiumBigReportAt ?? null };
    }
    // Monthly big report already used — fall through to mana
  } else if (hasSub && user.subscription!.plan === 'BASIC' && !spread.requiresSubscription) {
    return { allowed: true, reason: 'subscription' };
  }

  // Premium-only spreads (Celtic cross) cannot be bought with mana
  if (spread.requiresSubscription && !isPremium) {
    return { allowed: false, needsPremium: true, starsCost: spread.starsCost };
  }

  // Unlimited free spreads
  if (spread.freePerDay === -1) return { allowed: true, reason: 'free' };

  // ─── Free daily limit ──────────────────────────────────────────────────────
  // Claimed ATOMICALLY: the counter is incremented in the same UPDATE that
  // checks it, so parallel requests cannot each see "0 used" and slip through.
  if (spread.freePerDay > 0) {
    const today = kyivDayStart();

    // Reset the daily counter if it belongs to a previous day (idempotent).
    await db.user.updateMany({
      where: { id: userId, freeReadsReset: { lt: today } },
      data: { freeReadsToday: 0, freeReadsReset: today },
    });

    const claimed = await db.user.updateMany({
      where: { id: userId, freeReadsToday: { lt: spread.freePerDay } },
      data: { freeReadsToday: { increment: 1 } },
    });

    if (claimed.count === 1) {
      return { allowed: true, reason: 'free', freeLeft: spread.freePerDay - 1, consumed: 'free' };
    }
  }

  // ─── First reading free (new users, spreads up to FIRST_FREE_MAX_COST) ──
  if (!isPremium && firstFreeEligible(spread)) {
    const firstFree = await db.user.updateMany({
      where: { id: userId, firstReadingFree: true },
      data: { firstReadingFree: false },
    });
    if (firstFree.count === 1) {
      return { allowed: true, reason: 'first_free', consumed: 'first_free' };
    }
  }

  // ─── Bonus reads (streaks / referrals) ─────────────────────────────────────
  const bonusClaimed = await db.user.updateMany({
    where: { id: userId, bonusReads: { gt: 0 } },
    data: { bonusReads: { decrement: 1 } },
  });
  if (bonusClaimed.count === 1) {
    return { allowed: true, reason: 'bonus', consumed: 'bonus' };
  }

  // ─── Mana ──────────────────────────────────────────────────────────────────
  if (spread.manaCost > 0) {
    const manaClaimed = await db.user.updateMany({
      where: { id: userId, mana: { gte: spread.manaCost } },
      data: { mana: { decrement: spread.manaCost } },
    });
    if (manaClaimed.count === 1) {
      return { allowed: true, reason: 'mana', manaSpent: spread.manaCost, consumed: 'mana' };
    }
  }

  // Free spreads with 0 mana cost (but freePerDay was 0 — shouldn't happen, but be safe)
  if (spread.manaCost === 0) {
    return { allowed: true, reason: 'free' };
  }

  // Need to pay
  return { allowed: false, needsPayment: true, starsCost: spread.starsCost };
}

/**
 * Give back whatever checkReadingAccess() consumed.
 *
 * Called when the reading could not be produced (AI failure, timeout) so the
 * user never pays for something they did not receive. Best-effort: a failed
 * refund is logged, never thrown, so it cannot mask the original error.
 */
export async function refundReadingAccess(userId: string, access: AccessResult): Promise<void> {
  if (!access.consumed) return;

  try {
    if (access.consumed === 'free') {
      await db.user.updateMany({
        where: { id: userId, freeReadsToday: { gt: 0 } },
        data: { freeReadsToday: { decrement: 1 } },
      });
    } else if (access.consumed === 'bonus') {
      await db.user.update({
        where: { id: userId },
        data: { bonusReads: { increment: 1 } },
      });
    } else if (access.consumed === 'first_free') {
      await db.user.update({ where: { id: userId }, data: { firstReadingFree: true } });
    } else if (access.consumed === 'premium_big') {
      await db.user.update({ where: { id: userId }, data: { premiumBigReportAt: access.prevBigReportAt ?? null } });
    } else if (access.consumed === 'mana' && access.manaSpent) {
      await db.user.update({
        where: { id: userId },
        data: { mana: { increment: access.manaSpent } },
      });
    }
  } catch (e) {
    console.error('Failed to refund reading access:', e);
  }
}

// ─── Daily Check-in Logic ────────────────────────────────────────────────────
// +50 oракулов per day, +300 on every 7th day in a row.
// streakDays is the real number of consecutive days (not capped at 7), so the
// "30 days in a row" achievement is reachable. Missing a day restarts at 1.

export interface CheckInResult {
  streakDays: number;
  checkedInToday: boolean;
  manaAwarded: number;
}

export function streakBonus(streakDay: number): number {
  return streakDay > 0 && streakDay % 7 === 0 ? 300 : 50;
}

export async function updateStreak(userId: string): Promise<CheckInResult> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { streakDays: 0, checkedInToday: false, manaAwarded: 0 };

  // Day boundaries are Kyiv midnight. Days are compared by their Kyiv
  // calendar date, so values stored under the old UTC-midnight rule still
  // count as the right day and nobody's streak breaks on deploy.
  const now = new Date();
  const today = kyivDayStart(now);
  const todayKey = kyivDayKey(now);
  const lastKey = user.lastStreakDate ? kyivDayKey(new Date(user.lastStreakDate)) : null;

  if (lastKey === todayKey) {
    return { streakDays: user.streakDays, checkedInToday: true, manaAwarded: 0 };
  }

  const continues = lastKey === kyivYesterdayKey(now);
  const newStreak = continues ? user.streakDays + 1 : 1;
  const manaBonus = streakBonus(newStreak);

  // Conditional on lastStreakDate still being what we read: of several
  // parallel app opens only one can move it to today, so the bonus is paid once.
  const claimed = await db.user.updateMany({
    where: { id: userId, lastStreakDate: user.lastStreakDate },
    data: {
      streakDays: newStreak,
      lastStreakDate: today,
      mana: { increment: manaBonus },
    },
  });

  if (claimed.count !== 1) {
    const fresh = await db.user.findUnique({ where: { id: userId }, select: { streakDays: true } });
    return { streakDays: fresh?.streakDays ?? newStreak, checkedInToday: true, manaAwarded: 0 };
  }

  return { streakDays: newStreak, checkedInToday: true, manaAwarded: manaBonus };
}

// ─── Referral Logic ──────────────────────────────────────────────────────────
// +500 oракулов to the referrer when a new user joins via ref link

export const REFERRAL_BONUS = 500;

/**
 * Credit the referrer once per referred user. The Referral row (unique on
 * referredId) and the bonus are written in one transaction, so a retried
 * /start or a parallel /api/user call cannot pay twice.
 * Returns the referrer when a bonus was paid (for a notification).
 */
export async function processReferral(referredUserId: string, referrerTelegramId: bigint): Promise<{ telegramId: bigint; locale: string } | null> {
  const referrer = await db.user.findUnique({ where: { telegramId: referrerTelegramId } });
  if (!referrer || referrer.id === referredUserId) return null;

  try {
    await db.$transaction([
      db.referral.create({
        data: { referrerId: referrer.id, referredId: referredUserId, bonusGiven: true },
      }),
      db.user.update({
        where: { id: referrer.id },
        data: { mana: { increment: REFERRAL_BONUS } },
      }),
    ]);
    return { telegramId: referrer.telegramId, locale: referrer.locale };
  } catch (e: any) {
    if (e?.code === 'P2002') return null; // already referred
    throw e;
  }
}

/** Start params we accept as an acquisition source: tt_top3, yt_leo, ig_x … */
const SOURCE_RE = /^[a-z0-9_-]{2,40}$/i;

/**
 * Apply a deep-link start param to a user that was JUST created.
 *  - `ref_<telegramId>` → referral bonus for the inviter, source "ref"
 *  - anything else matching SOURCE_RE → stored as the acquisition source,
 *    so paid conversions can be traced back to a TikTok / Shorts video.
 * Existing users are never re-attributed.
 */
export async function applyStartParam(
  userId: string,
  startParam: string | null | undefined,
): Promise<{ referrer: { telegramId: bigint; locale: string } | null }> {
  const param = (startParam || '').trim();
  if (!param) return { referrer: null };

  if (param.startsWith('ref_')) {
    const raw = param.slice(4);
    if (!/^\d{1,20}$/.test(raw)) return { referrer: null };
    await db.user.updateMany({ where: { id: userId, source: null }, data: { source: 'ref' } });
    const referrer = await processReferral(userId, BigInt(raw));
    return { referrer };
  }

  if (param.startsWith('gift_')) {
    // Came from a premium gift link (redeemed separately in the webhook)
    await db.user.updateMany({ where: { id: userId, source: null }, data: { source: 'gift' } });
    return { referrer: null };
  }

  if (SOURCE_RE.test(param)) {
    await db.user.updateMany({ where: { id: userId, source: null }, data: { source: param.toLowerCase() } });
  }
  return { referrer: null };
}

export const REFERRAL_NOTICE: Record<'ru' | 'uk' | 'en', string> = {
  ru: `🎉 По твоей ссылке пришёл новый человек! +${REFERRAL_BONUS} оракулов уже на балансе 💎`,
  uk: `🎉 За твоїм посиланням прийшла нова людина! +${REFERRAL_BONUS} оракулів уже на балансі 💎`,
  en: `🎉 Someone joined with your link! +${REFERRAL_BONUS} oracles added to your balance 💎`,
};
