/**
 * What a spread costs THIS user right now — mirrors checkReadingAccess() on
 * the server so the UI shows the right price (strikethrough for premium,
 * "free" for the first reading) and does not block readings the server
 * would allow. The server stays the source of truth.
 */

import { firstFreeEligible, isBigReport, type SpreadConfig } from '@/data/spreads';

export type PriceKind = 'free' | 'premium' | 'premium_big' | 'first_free' | 'premium_only' | 'mana';

export interface EffectivePrice {
  kind: PriceKind;
  /** Oracles that will actually be spent */
  cost: number;
  /** Regular price, for the strikethrough */
  base: number;
}

interface PricingUser {
  isPremium: boolean;
  firstReadingFree?: boolean;
  premiumBigReportAvailable?: boolean;
}

export function effectivePrice(spread: SpreadConfig, user: PricingUser | null | undefined): EffectivePrice {
  const base = spread.manaCost;
  if (base <= 0 || spread.freePerDay === -1) return { kind: 'free', cost: 0, base };

  if (user?.isPremium) {
    if (!isBigReport(spread)) return { kind: 'premium', cost: 0, base };
    if (user.premiumBigReportAvailable) return { kind: 'premium_big', cost: 0, base };
    return { kind: 'mana', cost: base, base };
  }

  if (spread.requiresSubscription) return { kind: 'premium_only', cost: base, base };
  if (user?.firstReadingFree && firstFreeEligible(spread)) return { kind: 'first_free', cost: 0, base };
  return { kind: 'mana', cost: base, base };
}
