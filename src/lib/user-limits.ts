/**
 * Free tier & subscription logic
 * Controls who can access what and when
 */

import { db } from './db';
import type { SpreadConfig } from '@/data/spreads';

export interface AccessResult {
  allowed: boolean;
  reason?: 'free' | 'subscription' | 'premium' | 'bonus' | 'mana';
  needsPayment?: boolean;
  starsCost?: number;
  freeLeft?: number;
  manaSpent?: number;
  /** What was actually consumed — used to refund if the reading fails */
  consumed?: 'free' | 'bonus' | 'mana';
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

  // Check subscription / premium
  if (user.subscription?.status === 'ACTIVE' && user.subscription.expiresAt > new Date()) {
    const plan = user.subscription.plan;
    // VIP / PREMIUM = unlimited (no mana cost), BASIC = basic spreads
    if (plan === 'VIP' || plan === 'PREMIUM') return { allowed: true, reason: 'premium' };
    if (plan === 'BASIC' && !spread.requiresSubscription) return { allowed: true, reason: 'subscription' };
  }

  // Unlimited free spreads
  if (spread.freePerDay === -1) return { allowed: true, reason: 'free' };

  // ─── Free daily limit ──────────────────────────────────────────────────────
  // Claimed ATOMICALLY: the counter is incremented in the same UPDATE that
  // checks it, so parallel requests cannot each see "0 used" and slip through.
  if (spread.freePerDay > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
// +50 oракулов per day, +300 on day 7, then resets
// Missing a day resets streak to 0

export interface CheckInResult {
  streakDays: number;
  checkedInToday: boolean;
  manaAwarded: number;
}

export async function updateStreak(userId: string): Promise<CheckInResult> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { streakDays: 0, checkedInToday: false, manaAwarded: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Already checked in today
  if (user.lastStreakDate) {
    const lastDate = new Date(user.lastStreakDate);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() === today.getTime()) {
      return { streakDays: user.streakDays, checkedInToday: true, manaAwarded: 0 };
    }

    // Consecutive day — continue streak
    if (lastDate.getTime() === yesterday.getTime()) {
      const newStreak = (user.streakDays % 7) + 1; // 1-7 cycle
      const manaBonus = newStreak === 7 ? 300 : 50;

      await db.user.update({
        where: { id: userId },
        data: {
          streakDays: newStreak,
          lastStreakDate: today,
          mana: { increment: manaBonus },
        },
      });

      return { streakDays: newStreak, checkedInToday: true, manaAwarded: manaBonus };
    }
  }

  // First check-in ever, or streak broken — start at day 1
  const manaBonus = 50;
  await db.user.update({
    where: { id: userId },
    data: {
      streakDays: 1,
      lastStreakDate: today,
      mana: { increment: manaBonus },
    },
  });

  return { streakDays: 1, checkedInToday: true, manaAwarded: manaBonus };
}

// ─── Referral Logic ──────────────────────────────────────────────────────────
// +500 oракулов to the referrer when a new user joins via ref link

const REFERRAL_BONUS = 500;

export async function processReferral(referredUserId: string, referrerTelegramId: bigint): Promise<boolean> {
  const referrer = await db.user.findUnique({ where: { telegramId: referrerTelegramId } });
  if (!referrer) return false;

  // Don't let user refer themselves
  const referred = await db.user.findUnique({ where: { id: referredUserId } });
  if (referred && referred.telegramId === referrerTelegramId) return false;

  // Check if already referred
  const existing = await db.referral.findUnique({ where: { referredId: referredUserId } });
  if (existing) return false;

  await db.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
      bonusGiven: true,
    },
  });

  // Give mana bonus to referrer
  await db.user.update({
    where: { id: referrer.id },
    data: { mana: { increment: REFERRAL_BONUS } },
  });

  return true;
}
