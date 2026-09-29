/**
 * Gift redemption: one-time, never by the buyer, atomic under races.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const gifts = new Map<string, any>();
const grantPremium = vi.fn();

vi.mock('@/lib/premium', () => ({ grantPremium: (...a: any[]) => grantPremium(...a) }));
vi.mock('@/lib/db', () => {
  const premiumGift = {
    findUnique: async ({ where }: any) => (gifts.has(where.code) ? { ...gifts.get(where.code) } : null),
    updateMany: async ({ where, data }: any) => {
      const g = gifts.get(where.code);
      if (!g || g.redeemedByTelegramId !== null) return { count: 0 };
      Object.assign(g, data);
      return { count: 1 };
    },
  };
  return { db: { premiumGift, $transaction: async (fn: any) => fn({ premiumGift }) } };
});

import { redeemGift } from '@/lib/gifts';

beforeEach(() => {
  gifts.clear();
  grantPremium.mockClear();
  gifts.set('abcDEF123_-x', {
    code: 'abcDEF123_-x', planId: 'premium_1m', days: 30,
    buyerTelegramId: BigInt(1), chargeId: 'ch1', redeemedByTelegramId: null,
  });
});

describe('redeemGift', () => {
  it('grants premium once', async () => {
    expect(await redeemGift('abcDEF123_-x', 'u2', BigInt(2))).toMatchObject({ status: 'ok', days: 30 });
    expect(grantPremium).toHaveBeenCalledTimes(1);
    expect(await redeemGift('abcDEF123_-x', 'u3', BigInt(3))).toEqual({ status: 'already_used' });
  });

  it('buyer cannot redeem their own gift', async () => {
    expect(await redeemGift('abcDEF123_-x', 'u1', BigInt(1))).toEqual({ status: 'own_gift' });
    expect(grantPremium).not.toHaveBeenCalled();
  });

  it('two friends at once: only one gets it', async () => {
    const r = await Promise.all([
      redeemGift('abcDEF123_-x', 'u2', BigInt(2)),
      redeemGift('abcDEF123_-x', 'u3', BigInt(3)),
    ]);
    expect(r.filter((x) => x.status === 'ok')).toHaveLength(1);
    expect(grantPremium).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed codes', async () => {
    expect(await redeemGift('../../x', 'u2', BigInt(2))).toEqual({ status: 'not_found' });
  });
});
