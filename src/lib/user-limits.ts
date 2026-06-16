/**
 * Free tier & subscription logic
 * Controls who can access what and when
 */

import { db } from './db';
import type { SpreadConfig } from '@/data/spreads';

interface AccessResult {
  allowed: boolean;
  reason?: 'free' | 'subscription' | 'bonus' | 'mana';
  needsPayment?: boolean;
  starsCost?: number;
  freeLeft?: number;
  manaSpent?: number;
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

  // Check subscription
  if (user.subscription?.status === 'ACTIVE' && user.subscription.expiresAt > new Date()) {
    const plan = user.subscription.plan;
    // VIP = everything, PREMIUM = everything, BASIC = basic spreads
    if (plan === 'VIP' || plan === 'PREMIUM') return { allowed: true, reason: 'subscription' };
    if (plan === 'BASIC' && !spread.requiresSubscription) return { allowed: true, reason: 'subscription' };
  }

  // Unlimited free spreads
  if (spread.freePerDay === -1) return { allowed: true, reason: 'free' };

  // Check free daily limit
  if (spread.freePerDay > 0) {
    // Reset daily counter if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.freeReadsReset < today) {
      await db.user.update({
        where: { id: userId },
        data: { freeReadsToday: 0, freeReadsReset: today },
      });
      return { allowed: true, reason: 'free', freeLeft: spread.freePerDay - 1 };
    }

    if (user.freeReadsToday < spread.freePerDay) {
      return { allowed: true, reason: 'free', freeLeft: spread.freePerDay - user.freeReadsToday - 1 };
    }
  }

  // Check bonus reads (from streaks/referrals)
  if (user.bonusReads > 0) {
    return { allowed: true, reason: 'bonus' };
  }

  // Check mana balance
  if (spread.manaCost > 0 && user.mana >= spread.manaCost) {
    // Deduct mana server-side
    await db.user.update({
      where: { id: userId },
      data: { mana: { decrement: spread.manaCost } },
    });
    return { allowed: true, reason: 'mana', manaSpent: spread.manaCost };
  }

  // Free spreads with 0 mana cost (but freePerDay was 0 — shouldn't happen, but be safe)
  if (spread.manaCost === 0) {
    return { allowed: true, reason: 'free' };
  }

  // Need to pay
  return { allowed: false, needsPayment: true, starsCost: spread.starsCost };
}

// ─── Streak Logic ────────────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<{ streakDays: number; bonusEarned: boolean }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { streakDays: 0, bonusEarned: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = 1;
  let bonusEarned = false;

  if (user.lastStreakDate) {
    const lastDate = new Date(user.lastStreakDate);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() === today.getTime()) {
      // Already visited today
      return { streakDays: user.streakDays, bonusEarned: false };
    }

    if (lastDate.getTime() === yesterday.getTime()) {
      // Consecutive day
      newStreak = user.streakDays + 1;
    }
    // else: streak broken, starts at 1
  }

  // Bonus every 7 days
  const bonusReadsInc = newStreak % 7 === 0 ? 1 : 0;
  if (bonusReadsInc > 0) bonusEarned = true;

  await db.user.update({
    where: { id: userId },
    data: {
      streakDays: newStreak,
      lastStreakDate: today,
      bonusReads: { increment: bonusReadsInc },
    },
  });

  return { streakDays: newStreak, bonusEarned };
}

// ─── Referral Logic ──────────────────────────────────────────────────────────

export async function processReferral(referredUserId: string, referrerTelegramId: bigint): Promise<boolean> {
  const referrer = await db.user.findUnique({ where: { telegramId: referrerTelegramId } });
  if (!referrer) return false;

  // Check if already referred
  const existing = await db.referral.findUnique({ where: { referredId: referredUserId } });
  if (existing) return false;

  await db.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
    },
  });

  // Give bonus to referrer
  await db.user.update({
    where: { id: referrer.id },
    data: { bonusReads: { increment: 2 } },
  });

  return true;
}
