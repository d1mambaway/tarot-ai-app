/**
 * Tests for atomic consumption + refund of reading access.
 *
 * These cover the money-critical paths:
 *  - free / bonus / mana are claimed in a single conditional UPDATE
 *  - a claim that loses the race falls through instead of granting access
 *  - refundReadingAccess() gives back exactly what was taken
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SpreadConfig } from '@/data/spreads';

const mockUser = {
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
};

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: any[]) => mockUser.findUnique(...args),
      update: (...args: any[]) => mockUser.update(...args),
      updateMany: (...args: any[]) => mockUser.updateMany(...args),
    },
    referral: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { checkReadingAccess, refundReadingAccess } from '@/lib/user-limits';

function makeSpread(overrides: Partial<SpreadConfig> = {}): SpreadConfig {
  return {
    id: 'test_spread',
    type: 'TEST',
    category: 'tarot',
    name: { ru: 'Тест', uk: 'Тест', en: 'Test' },
    description: { ru: '', uk: '', en: '' },
    icon: '🔮',
    cardCount: 3,
    freePerDay: 1,
    starsCost: 50,
    manaCost: 100,
    requiresInput: 'none',
    ...overrides,
  } as SpreadConfig;
}

function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    telegramId: BigInt(12345),
    mana: 500,
    freeReadsToday: 0,
    freeReadsReset: new Date(),
    bonusReads: 0,
    subscription: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser.update.mockResolvedValue({});
});

describe('checkReadingAccess — atomic claims', () => {
  it('claims a free read with a conditional UPDATE, not a read-then-write', async () => {
    mockUser.findUnique.mockResolvedValue(makeUser());
    // reset-updateMany, then the claim
    mockUser.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });

    const result = await checkReadingAccess('user-1', makeSpread());

    expect(result).toMatchObject({ allowed: true, reason: 'free', consumed: 'free' });
    const claim = mockUser.updateMany.mock.calls[1][0];
    expect(claim.where).toMatchObject({ id: 'user-1', freeReadsToday: { lt: 1 } });
    expect(claim.data).toMatchObject({ freeReadsToday: { increment: 1 } });
  });

  it('falls through to mana when the free claim loses the race', async () => {
    mockUser.findUnique.mockResolvedValue(makeUser());
    mockUser.updateMany
      .mockResolvedValueOnce({ count: 0 }) // daily reset
      .mockResolvedValueOnce({ count: 0 }) // free claim lost
      .mockResolvedValueOnce({ count: 0 }) // no bonus reads
      .mockResolvedValueOnce({ count: 1 }); // mana claim wins

    const result = await checkReadingAccess('user-1', makeSpread());

    expect(result).toMatchObject({ allowed: true, reason: 'mana', manaSpent: 100, consumed: 'mana' });
    const manaClaim = mockUser.updateMany.mock.calls[3][0];
    expect(manaClaim.where).toMatchObject({ id: 'user-1', mana: { gte: 100 } });
  });

  it('never grants access when every claim loses (concurrent spend)', async () => {
    mockUser.findUnique.mockResolvedValue(makeUser({ mana: 10 }));
    mockUser.updateMany.mockResolvedValue({ count: 0 });

    const result = await checkReadingAccess('user-1', makeSpread());

    expect(result).toMatchObject({ allowed: false, needsPayment: true, starsCost: 50 });
  });

  it('does not touch counters for premium subscribers', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({ subscription: { status: 'ACTIVE', plan: 'PREMIUM', expiresAt: new Date(Date.now() + 8.64e7) } }),
    );

    const result = await checkReadingAccess('user-1', makeSpread());

    expect(result).toMatchObject({ allowed: true, reason: 'premium' });
    expect(result.consumed).toBeUndefined();
    expect(mockUser.updateMany).not.toHaveBeenCalled();
  });
});

describe('refundReadingAccess', () => {
  it('returns spent mana when the reading fails', async () => {
    await refundReadingAccess('user-1', { allowed: true, reason: 'mana', manaSpent: 100, consumed: 'mana' });

    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { mana: { increment: 100 } },
    });
  });

  it('returns a bonus read', async () => {
    await refundReadingAccess('user-1', { allowed: true, reason: 'bonus', consumed: 'bonus' });

    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { bonusReads: { increment: 1 } },
    });
  });

  it('gives back the daily free read without going below zero', async () => {
    mockUser.updateMany.mockResolvedValue({ count: 1 });

    await refundReadingAccess('user-1', { allowed: true, reason: 'free', consumed: 'free' });

    expect(mockUser.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', freeReadsToday: { gt: 0 } },
      data: { freeReadsToday: { decrement: 1 } },
    });
  });

  it('does nothing when nothing was consumed (premium / unlimited)', async () => {
    await refundReadingAccess('user-1', { allowed: true, reason: 'premium' });

    expect(mockUser.update).not.toHaveBeenCalled();
    expect(mockUser.updateMany).not.toHaveBeenCalled();
  });

  it('never throws when the refund itself fails', async () => {
    mockUser.update.mockRejectedValue(new Error('db down'));

    await expect(
      refundReadingAccess('user-1', { allowed: true, reason: 'mana', manaSpent: 100, consumed: 'mana' }),
    ).resolves.toBeUndefined();
  });
});
