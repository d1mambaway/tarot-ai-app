/**
 * Shop catalog — the single source of truth for what can be bought and for
 * how many Stars. Used by /api/payment (creating invoices) and by the webhook
 * (validating pre_checkout_query and crediting successful_payment), so the
 * amount that is charged and the amount that is credited can never drift apart.
 *
 * Client-safe: no server imports here, ShopScreen reads the same numbers.
 */

// Oракулы pack definitions.
//
// Star prices are set 1⭐ under Telegram's own in-app top-up bundles
// (250 / 500 / 1000 / 2500 ⭐) — 249/499/999/2499 reads as cheaper than the
// round number. Курс растёт с размером пака (база — 3 оракула/⭐).
export const MANA_PACKS: Record<string, { mana: number; stars: number; label: string; description: string }> = {
  pack_249:  { mana: 750,   stars: 249,  label: '750 оракулов',   description: '750 оракулов для раскладов' },
  pack_499:  { mana: 1750,  stars: 499,  label: '1750 оракулов',  description: '1750 оракулов для раскладов (+16% к базовому курсу)' },
  pack_999:  { mana: 4000,  stars: 999,  label: '4000 оракулов',  description: '4000 оракулов для раскладов (+33% к базовому курсу)' },
  pack_2499: { mana: 11000, stars: 2499, label: '11000 оракулов', description: '11000 оракулов для раскладов (+46% к базовому курсу)' },
};

/**
 * Starter offer: one purchase per user, only during the first 48 hours after
 * the account was created. ~5 оракулов/⭐ vs the base 3/⭐.
 */
export const STARTER_OFFER = {
  id: 'starter_99',
  mana: 500,
  stars: 99,
  windowHours: 48,
  label: '500 оракулов — стартовый набор',
  description: 'Одноразовое предложение для новых пользователей: 500 оракулов за 99 ⭐',
} as const;

export const PREMIUM_PLANS = {
  premium_1m:  { months: 1,  stars: 499,  label: { ru: '1 месяц',   uk: '1 місяць',  en: '1 month' } },
  premium_3m:  { months: 3,  stars: 999,  label: { ru: '3 месяца',  uk: '3 місяці',  en: '3 months' } },
  premium_1y:  { months: 12, stars: 2499, label: { ru: '1 год',     uk: '1 рік',     en: '1 year' } },
} as const;

export type PremiumPlanId = keyof typeof PREMIUM_PLANS;

/** Cheapest premium price, for "from N ⭐" labels */
export const PREMIUM_FROM_STARS = Math.min(...Object.values(PREMIUM_PLANS).map((p) => p.stars));

export function starterOfferAvailable(createdAt: Date, alreadyBought: boolean, now = new Date()): boolean {
  if (alreadyBought) return false;
  return now.getTime() - createdAt.getTime() < STARTER_OFFER.windowHours * 3600_000;
}

/** Ms left in the starter window (0 when it is over) */
export function starterOfferMsLeft(createdAt: Date, now = new Date()): number {
  return Math.max(0, createdAt.getTime() + STARTER_OFFER.windowHours * 3600_000 - now.getTime());
}

export type InvoicePayload =
  | { type: 'premium'; planId: PremiumPlanId; userId: number }
  | { type: 'mana_pack'; packId: string; userId: number };

/**
 * What a payload is worth, straight from the catalog — never from numbers
 * inside the payload itself. Returns null for anything unknown.
 */
export function resolvePayload(raw: string): { payload: InvoicePayload; stars: number; mana: number; days: number } | null {
  let p: any;
  try {
    p = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!p || typeof p !== 'object') return null;

  const own = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

  if (p.type === 'premium' && typeof p.planId === 'string' && own(PREMIUM_PLANS, p.planId)) {
    const plan = PREMIUM_PLANS[p.planId as PremiumPlanId];
    return { payload: p, stars: plan.stars, mana: 0, days: plan.months * 30 };
  }
  if (p.type === 'mana_pack' && typeof p.packId === 'string') {
    if (p.packId === STARTER_OFFER.id) {
      return { payload: p, stars: STARTER_OFFER.stars, mana: STARTER_OFFER.mana, days: 0 };
    }
    const pack = own(MANA_PACKS, p.packId) ? MANA_PACKS[p.packId] : undefined;
    if (pack) return { payload: p, stars: pack.stars, mana: pack.mana, days: 0 };
  }
  return null;
}
