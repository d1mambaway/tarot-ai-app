/**
 * Pure-logic tests for the economy catalog, pricing and AI helpers.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeLLMOutput, withDeadline } from '@/lib/ai/clients';
import { getZodiacSign } from '@/lib/ai/prompts/esoteric';
import { resolvePayload, starterOfferAvailable, STARTER_OFFER, PREMIUM_FROM_STARS } from '@/lib/shop';
import { drawRunes, RUNES } from '@/data/runes';
import { drawCards, shuffle } from '@/data/tarot-cards';
import { effectivePrice } from '@/lib/pricing';
import { getSpreadById } from '@/data/spreads';
import { secretMatches } from '@/lib/secrets';

describe('sanitizeLLMOutput', () => {
  it('keeps English text intact', () => {
    const en = 'The Fool reversed warns you about reckless choices this week.';
    expect(sanitizeLLMOutput(en)).toBe(en);
  });

  it('still strips stray English words from Russian text', () => {
    expect(sanitizeLLMOutput('Карта говорит о переменах и growth в твоей жизни')).toBe(
      'Карта говорит о переменах и в твоей жизни',
    );
  });

  it('strips CJK characters', () => {
    expect(sanitizeLLMOutput('Судьба 命运 зовёт')).toBe('Судьба зовёт');
  });
});

describe('withDeadline', () => {
  it('rejects a call that outlives the deadline', async () => {
    await expect(withDeadline(new Promise(() => {}), 10)).rejects.toThrow();
  });
  it('passes through a fast result', async () => {
    await expect(withDeadline(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });
});

describe('getZodiacSign', () => {
  it.each([
    ['1995-04-15', 'Овен'],
    ['1995-04-25', 'Телец'],
    ['15.04.1995', 'Овен'],
    ['15.03.1990', 'Рыбы'],
    ['10.01.2000', 'Козерог'],
    ['2000-12-25', 'Козерог'],
    ['2000-08-15', 'Лев'],
  ])('%s → %s', (date, sign) => {
    expect(getZodiacSign(date, 'ru')).toBe(sign);
  });

  it('localizes', () => {
    expect(getZodiacSign('2000-08-15', 'en')).toBe('Leo');
    expect(getZodiacSign('2000-11-10', 'uk')).toBe('Скорпіон');
  });
});

describe('shop catalog', () => {
  it('resolves prices from the catalog, ignoring numbers in the payload', () => {
    const r = resolvePayload(JSON.stringify({ type: 'mana_pack', packId: 'pack_249', mana: 999999, userId: 1 }));
    expect(r).toMatchObject({ stars: 249, mana: 750 });
  });

  it('resolves premium plans to days', () => {
    expect(resolvePayload(JSON.stringify({ type: 'premium', planId: 'premium_3m', userId: 1 }))).toMatchObject({
      stars: 999,
      days: 90,
    });
  });

  it('rejects unknown items', () => {
    expect(resolvePayload(JSON.stringify({ type: 'mana_pack', packId: '__proto__' }))).toBeNull();
    expect(resolvePayload('not json')).toBeNull();
  });

  it('starter offer: 48 hours, once', () => {
    const now = new Date('2026-10-01T12:00:00Z');
    expect(starterOfferAvailable(new Date('2026-09-30T13:00:00Z'), false, now)).toBe(true);
    expect(starterOfferAvailable(new Date('2026-09-29T11:00:00Z'), false, now)).toBe(false);
    expect(starterOfferAvailable(new Date('2026-09-30T13:00:00Z'), true, now)).toBe(false);
    expect(resolvePayload(JSON.stringify({ type: 'mana_pack', packId: STARTER_OFFER.id }))).toMatchObject({
      stars: 99,
      mana: 500,
    });
  });

  it('premium "from" price is the real cheapest plan', () => {
    expect(PREMIUM_FROM_STARS).toBe(499);
  });
});

describe('random draws', () => {
  it('draws unique runes, symmetric ones never reversed', () => {
    for (let i = 0; i < 200; i++) {
      const runes = drawRunes(3);
      expect(new Set(runes.map((r) => r.id)).size).toBe(3);
      for (const r of runes) if (!r.reversible) expect(r.reversed).toBe(false);
    }
    expect(RUNES).toHaveLength(24);
  });

  it('draws unique tarot cards', () => {
    const cards = drawCards(10);
    expect(new Set(cards.map((c) => c.id)).size).toBe(10);
  });

  it('shuffle is roughly uniform', () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 8000; i++) counts[shuffle([0, 1, 2, 3])[0]]++;
    for (const c of counts) expect(c).toBeGreaterThan(1700);
  });
});

describe('effectivePrice', () => {
  const tarot = getSpreadById('what_they_think')!;
  const natal = getSpreadById('natal_chart')!;
  const celtic = getSpreadById('celtic_cross')!;

  it('premium: struck-through regular price, 0 to pay', () => {
    expect(effectivePrice(tarot, { isPremium: true })).toEqual({ kind: 'premium', cost: 0, base: 222 });
  });

  it('premium: big report free once a month, then mana', () => {
    expect(effectivePrice(natal, { isPremium: true, premiumBigReportAvailable: true }).cost).toBe(0);
    expect(effectivePrice(natal, { isPremium: true, premiumBigReportAvailable: false }).cost).toBe(1111);
  });

  it('first reading free only for cheap spreads', () => {
    expect(effectivePrice(tarot, { isPremium: false, firstReadingFree: true }).kind).toBe('first_free');
    expect(effectivePrice(natal, { isPremium: false, firstReadingFree: true }).kind).toBe('mana');
  });

  it('celtic cross is premium only', () => {
    expect(effectivePrice(celtic, { isPremium: false }).kind).toBe('premium_only');
  });
});

describe('secretMatches', () => {
  it('fails closed in production when the secret is missing', () => {
    const prev = { v: process.env.VERCEL_ENV, s: process.env.TEST_SECRET_X };
    delete process.env.TEST_SECRET_X;
    process.env.VERCEL_ENV = 'production';
    expect(secretMatches('TEST_SECRET_X', 'anything')).toBe(false);
    process.env.TEST_SECRET_X = 'abc';
    expect(secretMatches('TEST_SECRET_X', 'abc')).toBe(true);
    expect(secretMatches('TEST_SECRET_X', 'abd')).toBe(false);
    process.env.VERCEL_ENV = prev.v;
    if (prev.s === undefined) delete process.env.TEST_SECRET_X;
  });
});

import { kyivDayKey, kyivDayStart, kyivYesterdayKey } from '@/lib/date';

describe('Kyiv day boundaries', () => {
  it('23:30 UTC is already the next day in Kyiv (summer, UTC+3)', () => {
    const d = new Date('2026-07-10T23:30:00Z');
    expect(kyivDayKey(d)).toBe('2026-07-11');
    expect(kyivDayStart(d).toISOString()).toBe('2026-07-10T21:00:00.000Z');
    expect(kyivYesterdayKey(d)).toBe('2026-07-10');
  });

  it('winter offset is UTC+2', () => {
    const d = new Date('2026-01-15T10:00:00Z');
    expect(kyivDayStart(d).toISOString()).toBe('2026-01-14T22:00:00.000Z');
  });

  it('old UTC-midnight streak dates still map to the same calendar day', () => {
    expect(kyivDayKey(new Date('2026-09-29T00:00:00Z'))).toBe('2026-09-29');
  });
});
