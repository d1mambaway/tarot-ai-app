/**
 * Tests for user access control and streak/referral logic.
 *
 * These functions use Prisma DB — we mock `@/lib/db` so tests
 * run instantly with no database connection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SpreadConfig } from '@/data/spreads';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockUser = {
  findUnique: vi.fn(),
};
const mockReferral = {
  findUnique: vi.fn(),
  create: vi.fn(),
};
const mockUserUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: any[]) => mockUser.findUnique(...args),
      update: (...args: any[]) => mockUserUpdate(...args),
    },
    referral: {
      findUnique: (...args: any[]) => mockReferral.findUnique(...args),
      create: (...args: any[]) => mockReferral.create(...args),
    },
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  };
}

function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    telegramId: BigInt(12345),
    mana: 500,
    freeReadsToday: 0,
    freeReadsReset: new Date(0),
    bonusReads: 0,
    streakDays: 0,
    lastStreakDate: null,
    subscription: null,
    ...overrides,
  };
}

// ─── checkReadingAccess ──────────────────────────────────────────────────────

describe('checkReadingAccess', () => {
  let checkReadingAccess: typeof import('@/lib/user-limits').checkReadingAccess;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/user-limits');
    checkReadingAccess = mod.checkReadingAccess;
  });

  it('denies access when user not found', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const spread = makeSpread({ starsCost: 75 });

    const result = await checkReadingAccess('unknown-id', spread);

    expect(result.allowed).toBe(false);
    expect(result.needsPayment).toBe(true);
    expect(result.starsCost).toBe(75);
  });

  it('allows access with active VIP subscription', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        subscription: {
          status: 'ACTIVE',
          plan: 'VIP',
          expiresAt: new Date(Date.now() + 86400_000), // tomorrow
        },
      }),
    );

    const result = await checkReadingAccess('user-1', makeSpread({ requiresSubscription: 'VIP' }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('subscription');
  });

  it('allows access with active PREMIUM subscription', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        subscription: {
          status: 'ACTIVE',
          plan: 'PREMIUM',
          expiresAt: new Date(Date.now() + 86400_000),
        },
      }),
    );

    const result = await checkReadingAccess('user-1', makeSpread());

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('subscription');
  });

  it('denies BASIC subscription for premium-only spreads', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        subscription: {
          status: 'ACTIVE',
          plan: 'BASIC',
          expiresAt: new Date(Date.now() + 86400_000),
        },
        freeReadsToday: 5,
        freeReadsReset: new Date(),
        bonusReads: 0,
        mana: 0,
      }),
    );

    const result = await checkReadingAccess(
      'user-1',
      makeSpread({ requiresSubscription: 'PREMIUM', freePerDay: 0 }),
    );

    expect(result.allowed).toBe(false);
    expect(result.needsPayment).toBe(true);
  });

  it('denies expired subscription', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        subscription: {
          status: 'ACTIVE',
          plan: 'VIP',
          expiresAt: new Date(Date.now() - 86400_000), // yesterday
        },
        freeReadsToday: 5,
        freeReadsReset: new Date(),
        bonusReads: 0,
        mana: 0,
      }),
    );

    const result = await checkReadingAccess(
      'user-1',
      makeSpread({ freePerDay: 0 }),
    );

    expect(result.allowed).toBe(false);
  });

  it('allows unlimited free spreads (freePerDay = -1)', async () => {
    mockUser.findUnique.mockResolvedValue(makeUser({ mana: 0 }));

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: -1 }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('free');
  });

  it('allows access within daily free limit', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        freeReadsToday: 0,
        freeReadsReset: new Date(), // already reset today
      }),
    );

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: 3 }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('free');
    expect(result.freeLeft).toBe(2);
  });

  it('resets daily counter when reset date is yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockUser.findUnique.mockResolvedValue(
      makeUser({
        freeReadsToday: 5,
        freeReadsReset: yesterday,
      }),
    );
    mockUserUpdate.mockResolvedValue({});

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: 2 }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('free');
    expect(mockUserUpdate).toHaveBeenCalled(); // reset counter
  });

  it('uses bonus reads when free limit exhausted', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        freeReadsToday: 5,
        freeReadsReset: new Date(),
        bonusReads: 3,
      }),
    );

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: 1 }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('bonus');
  });

  it('deducts mana when no free/bonus reads available', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        freeReadsToday: 5,
        freeReadsReset: new Date(),
        bonusReads: 0,
        mana: 200,
      }),
    );
    mockUserUpdate.mockResolvedValue({});

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: 1, manaCost: 100 }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('mana');
    expect(result.manaSpent).toBe(100);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { mana: { decrement: 100 } },
      }),
    );
  });

  it('denies access when mana insufficient', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        freeReadsToday: 5,
        freeReadsReset: new Date(),
        bonusReads: 0,
        mana: 50,
      }),
    );

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: 1, manaCost: 100 }));

    expect(result.allowed).toBe(false);
    expect(result.needsPayment).toBe(true);
  });

  it('allows free spread with 0 mana cost', async () => {
    mockUser.findUnique.mockResolvedValue(
      makeUser({
        freeReadsToday: 5,
        freeReadsReset: new Date(),
        bonusReads: 0,
        mana: 0,
      }),
    );

    const result = await checkReadingAccess('user-1', makeSpread({ freePerDay: 0, manaCost: 0 }));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('free');
  });
});

// ─── updateStreak ────────────────────────────────────────────────────────────

describe('updateStreak', () => {
  let updateStreak: typeof import('@/lib/user-limits').updateStreak;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/user-limits');
    updateStreak = mod.updateStreak;
  });

  it('returns zeros for non-existent user', async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const result = await updateStreak('nonexistent');

    expect(result).toEqual({ streakDays: 0, checkedInToday: false, manaAwarded: 0 });
  });

  it('starts a new streak (first check-in ever)', async () => {
    mockUser.findUnique.mockResolvedValue(makeUser({ lastStreakDate: null, streakDays: 0 }));
    mockUserUpdate.mockResolvedValue({});

    const result = await updateStreak('user-1');

    expect(result.streakDays).toBe(1);
    expect(result.checkedInToday).toBe(true);
    expect(result.manaAwarded).toBe(50);
  });

  it('reports already checked in today (no duplicate bonus)', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    mockUser.findUnique.mockResolvedValue(
      makeUser({ lastStreakDate: today, streakDays: 3 }),
    );

    const result = await updateStreak('user-1');

    expect(result.streakDays).toBe(3);
    expect(result.checkedInToday).toBe(true);
    expect(result.manaAwarded).toBe(0);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('continues streak on consecutive day', async () => {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    mockUser.findUnique.mockResolvedValue(
      makeUser({ lastStreakDate: yesterday, streakDays: 3 }),
    );
    mockUserUpdate.mockResolvedValue({});

    const result = await updateStreak('user-1');

    expect(result.streakDays).toBe(4);
    expect(result.manaAwarded).toBe(50);
  });

  it('gives 300 mana on day 7', async () => {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    mockUser.findUnique.mockResolvedValue(
      makeUser({ lastStreakDate: yesterday, streakDays: 6 }),
    );
    mockUserUpdate.mockResolvedValue({});

    const result = await updateStreak('user-1');

    expect(result.streakDays).toBe(7);
    expect(result.manaAwarded).toBe(300);
  });

  it('resets to day 1 after day 7 (cycles)', async () => {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    mockUser.findUnique.mockResolvedValue(
      makeUser({ lastStreakDate: yesterday, streakDays: 7 }),
    );
    mockUserUpdate.mockResolvedValue({});

    const result = await updateStreak('user-1');

    // 7 % 7 + 1 = 1
    expect(result.streakDays).toBe(1);
    expect(result.manaAwarded).toBe(50);
  });

  it('resets streak when a day is skipped', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(0, 0, 0, 0);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    mockUser.findUnique.mockResolvedValue(
      makeUser({ lastStreakDate: twoDaysAgo, streakDays: 5 }),
    );
    mockUserUpdate.mockResolvedValue({});

    const result = await updateStreak('user-1');

    expect(result.streakDays).toBe(1);
    expect(result.manaAwarded).toBe(50);
  });
});

// ─── processReferral ─────────────────────────────────────────────────────────

describe('processReferral', () => {
  let processReferral: typeof import('@/lib/user-limits').processReferral;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/user-limits');
    processReferral = mod.processReferral;
  });

  it('gives 500 mana bonus to referrer', async () => {
    mockUser.findUnique
      .mockResolvedValueOnce(makeUser({ id: 'referrer-1', telegramId: BigInt(111) })) // referrer
      .mockResolvedValueOnce(makeUser({ id: 'referred-1', telegramId: BigInt(222) })); // referred
    mockReferral.findUnique.mockResolvedValue(null); // no existing referral
    mockReferral.create.mockResolvedValue({});
    mockUserUpdate.mockResolvedValue({});

    const result = await processReferral('referred-1', BigInt(111));

    expect(result).toBe(true);
    expect(mockReferral.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referrerId: 'referrer-1',
          referredId: 'referred-1',
          bonusGiven: true,
        }),
      }),
    );
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { mana: { increment: 500 } },
      }),
    );
  });

  it('prevents self-referral', async () => {
    const tgId = BigInt(12345);
    mockUser.findUnique
      .mockResolvedValueOnce(makeUser({ id: 'user-1', telegramId: tgId })) // referrer
      .mockResolvedValueOnce(makeUser({ id: 'user-1', telegramId: tgId })); // referred = same person

    const result = await processReferral('user-1', tgId);

    expect(result).toBe(false);
    expect(mockReferral.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate referral', async () => {
    mockUser.findUnique
      .mockResolvedValueOnce(makeUser({ id: 'referrer-1', telegramId: BigInt(111) }))
      .mockResolvedValueOnce(makeUser({ id: 'referred-1', telegramId: BigInt(222) }));
    mockReferral.findUnique.mockResolvedValue({ id: 'existing-ref' }); // already referred

    const result = await processReferral('referred-1', BigInt(111));

    expect(result).toBe(false);
    expect(mockReferral.create).not.toHaveBeenCalled();
  });

  it('fails when referrer not found', async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const result = await processReferral('referred-1', BigInt(99999));

    expect(result).toBe(false);
  });
});
