/**
 * Premium gifts: one user pays, gets a one-time link, a friend opens it and
 * receives premium. Link: https://t.me/<bot>?start=gift_<code>
 */

import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { db } from './db';
import { grantPremium } from './premium';
import { PREMIUM_PLANS, type PremiumPlanId } from './shop';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'cardsofmagic_bot';

export function giftLink(code: string): string {
  return `https://t.me/${BOT_USERNAME}?start=gift_${code}`;
}

/** 12 url-safe chars ≈ 72 bits — not guessable */
export function newGiftCode(): string {
  return crypto.randomBytes(9).toString('base64url');
}

export async function createGift(
  tx: Prisma.TransactionClient,
  params: { planId: PremiumPlanId; days: number; buyerTelegramId: bigint; chargeId: string },
) {
  return tx.premiumGift.create({
    data: {
      code: newGiftCode(),
      planId: params.planId,
      days: params.days,
      buyerTelegramId: params.buyerTelegramId,
      chargeId: params.chargeId,
    },
  });
}

export type RedeemResult =
  | { status: 'ok'; days: number; planId: PremiumPlanId; buyerTelegramId: bigint }
  | { status: 'not_found' | 'already_used' | 'own_gift' };

/**
 * Redeem once: the gift row is claimed with a conditional UPDATE in the same
 * transaction that grants premium, so two people opening the link at the same
 * time cannot both get it.
 */
export async function redeemGift(code: string, userId: string, userTelegramId: bigint): Promise<RedeemResult> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(code)) return { status: 'not_found' };

  const gift = await db.premiumGift.findUnique({ where: { code } });
  if (!gift) return { status: 'not_found' };
  if (gift.buyerTelegramId === userTelegramId) return { status: 'own_gift' };
  if (gift.redeemedByTelegramId !== null) return { status: 'already_used' };

  const ok = await db.$transaction(async (tx) => {
    const claimed = await tx.premiumGift.updateMany({
      where: { code, redeemedByTelegramId: null },
      data: { redeemedByTelegramId: userTelegramId, redeemedAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    await grantPremium(userId, gift.days, `gift:${gift.chargeId}`, tx);
    return true;
  });

  if (!ok) return { status: 'already_used' };
  return { status: 'ok', days: gift.days, planId: gift.planId as PremiumPlanId, buyerTelegramId: gift.buyerTelegramId };
}

type Locale = 'ru' | 'uk' | 'en';

export function planLabel(planId: PremiumPlanId, l: Locale): string {
  return PREMIUM_PLANS[planId]?.label[l] ?? '';
}

export const GIFT_TEXT = {
  bought: (link: string, plan: string): Record<Locale, string> => ({
    ru: `🎁 <b>Подарок готов!</b>\nPremium на ${plan}. Перешли другу эту ссылку — она сработает один раз:\n\n${link}`,
    uk: `🎁 <b>Подарунок готовий!</b>\nPremium на ${plan}. Перешли другу це посилання — воно спрацює один раз:\n\n${link}`,
    en: `🎁 <b>Your gift is ready!</b>\nPremium for ${plan}. Send this link to a friend — it works once:\n\n${link}`,
  }),
  shareBtn: { ru: '📤 Отправить другу', uk: '📤 Надіслати другові', en: '📤 Send to a friend' } as Record<Locale, string>,
  shareText: {
    ru: '🎁 Дарю тебе Premium в Магии Карт — расклады таро без ограничений',
    uk: '🎁 Дарую тобі Premium у Магії Карт — розклади таро без обмежень',
    en: '🎁 A Premium gift for you in Magic of Cards — unlimited tarot readings',
  } as Record<Locale, string>,
  received: (plan: string): Record<Locale, string> => ({
    ru: `👑 <b>Тебе подарили Premium на ${plan}!</b>\nВсе расклады теперь за 0 оракулов. Открой приложение ✨`,
    uk: `👑 <b>Тобі подарували Premium на ${plan}!</b>\nУсі розклади тепер за 0 оракулів. Відкрий додаток ✨`,
    en: `👑 <b>You got Premium for ${plan} as a gift!</b>\nEvery reading now costs 0 oracles. Open the app ✨`,
  }),
  toBuyer: (plan: string): Record<Locale, string> => ({
    ru: `🎉 Твой подарок открыли — друг получил Premium на ${plan}!`,
    uk: `🎉 Твій подарунок відкрили — друг отримав Premium на ${plan}!`,
    en: `🎉 Your gift was opened — your friend got Premium for ${plan}!`,
  }),
  used: {
    ru: 'Этот подарок уже активирован 🙈',
    uk: 'Цей подарунок уже активовано 🙈',
    en: 'This gift has already been redeemed 🙈',
  } as Record<Locale, string>,
  own: {
    ru: 'Это твой собственный подарок — перешли ссылку другу 🎁',
    uk: 'Це твій власний подарунок — перешли посилання другові 🎁',
    en: 'This is your own gift — send the link to a friend 🎁',
  } as Record<Locale, string>,
};
