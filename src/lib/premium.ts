/**
 * Premium subscription helpers
 * Manages premium status, granting, revoking
 */

import { db } from './db';

export interface PremiumStatus {
  isPremium: boolean;
  plan: string | null;
  expiresAt: Date | null;
  daysLeft: number;
}

// Premium plan definitions
export const PREMIUM_PLANS = {
  premium_1m:  { months: 1,  stars: 1500, label: { ru: '1 месяц',   uk: '1 місяць',  en: '1 month' } },
  premium_3m:  { months: 3,  stars: 3500, label: { ru: '3 месяца',  uk: '3 місяці',  en: '3 months' } },
  premium_1y:  { months: 12, stars: 6000, label: { ru: '1 год',     uk: '1 рік',     en: '1 year' } },
} as const;

export type PremiumPlanId = keyof typeof PREMIUM_PLANS;

/**
 * Check if a user has active premium
 */
export async function checkPremium(userId: string): Promise<PremiumStatus> {
  const sub = await db.subscription.findUnique({ where: { userId } });

  if (!sub || sub.status !== 'ACTIVE' || sub.expiresAt <= new Date()) {
    // Auto-expire if needed
    if (sub && sub.status === 'ACTIVE' && sub.expiresAt <= new Date()) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
    }
    return { isPremium: false, plan: null, expiresAt: null, daysLeft: 0 };
  }

  const daysLeft = Math.max(0, Math.ceil((sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return {
    isPremium: sub.plan === 'PREMIUM' || sub.plan === 'VIP',
    plan: sub.plan,
    expiresAt: sub.expiresAt,
    daysLeft,
  };
}

/**
 * Check premium by telegramId
 */
export async function checkPremiumByTelegramId(telegramId: bigint): Promise<PremiumStatus> {
  const user = await db.user.findUnique({ where: { telegramId } });
  if (!user) return { isPremium: false, plan: null, expiresAt: null, daysLeft: 0 };
  return checkPremium(user.id);
}

/**
 * Grant premium to a user
 */
export async function grantPremium(
  userId: string,
  days: number,
  starsTxId?: string,
): Promise<PremiumStatus> {
  const now = new Date();
  const existing = await db.subscription.findUnique({ where: { userId } });

  let expiresAt: Date;

  if (existing && existing.status === 'ACTIVE' && existing.expiresAt > now) {
    // Extend existing premium
    expiresAt = new Date(existing.expiresAt.getTime() + days * 24 * 60 * 60 * 1000);
  } else {
    // New subscription
    expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      expiresAt,
      starsTxId: starsTxId || null,
    },
    update: {
      plan: 'PREMIUM',
      status: 'ACTIVE',
      expiresAt,
      starsTxId: starsTxId || existing?.starsTxId || null,
    },
  });

  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return { isPremium: true, plan: 'PREMIUM', expiresAt, daysLeft };
}

/**
 * Revoke premium from a user
 */
export async function revokePremium(userId: string): Promise<boolean> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub) return false;

  await db.subscription.update({
    where: { id: sub.id },
    data: { status: 'CANCELLED', expiresAt: new Date() },
  });

  return true;
}

/**
 * Calculate days for a premium plan
 */
export function planToDays(planId: PremiumPlanId): number {
  const plan = PREMIUM_PLANS[planId];
  return plan.months * 30; // approximate
}
