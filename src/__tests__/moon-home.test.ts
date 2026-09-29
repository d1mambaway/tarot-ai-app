import { describe, it, expect } from 'vitest';
import { getMoonInfo, phaseFromAngle, daysUntil } from '@/lib/moon';
import { signIndexFromDate, signKeyFromBirthDate, parseBirthDate } from '@/lib/zodiac';
import { daysLabel, pluralForm } from '@/lib/plural';
import { personalKey } from '@/data/moon-texts';
import { QUOTE_COUNT, quoteAt } from '@/data/quotes';

describe('plural', () => {
  it('russian day forms', () => {
    expect(daysLabel(1, 'ru')).toBe('1 день');
    expect(daysLabel(2, 'ru')).toBe('2 дня');
    expect(daysLabel(5, 'ru')).toBe('5 дней');
    expect(daysLabel(11, 'ru')).toBe('11 дней');
    expect(daysLabel(21, 'ru')).toBe('21 день');
    expect(daysLabel(104, 'ru')).toBe('104 дня');
  });
  it('ukrainian and english', () => {
    expect(daysLabel(3, 'uk')).toBe('3 дні');
    expect(daysLabel(12, 'uk')).toBe('12 днів');
    expect(daysLabel(1, 'en')).toBe('1 day');
    expect(daysLabel(7, 'en')).toBe('7 days');
    expect(pluralForm(0, 'a', 'b', 'c')).toBe('c');
  });
});

describe('zodiac', () => {
  it('sun sign boundaries', () => {
    expect(signIndexFromDate(3, 21)).toBe(0); // Aries
    expect(signIndexFromDate(3, 20)).toBe(11); // Pisces
    expect(signIndexFromDate(12, 31)).toBe(9); // Capricorn
    expect(signIndexFromDate(1, 1)).toBe(9);
    expect(signIndexFromDate(1, 20)).toBe(10); // Aquarius
    expect(signIndexFromDate(11, 5)).toBe(7); // Scorpio
  });
  it('validates birth dates', () => {
    expect(parseBirthDate('1990-02-30')).toBeNull();
    expect(parseBirthDate('1990-2-3')).toBeNull();
    expect(parseBirthDate('2999-01-01')).toBeNull();
    expect(signKeyFromBirthDate('1988-07-30')).toBe('leo');
  });
  it('personal key is symmetric distance', () => {
    expect(personalKey(7, 7)).toBe(0);
    expect(personalKey(1, 7)).toBe(6);
    expect(personalKey(11, 7)).toBe(4);
    expect(personalKey(4, 7)).toBe(3);
  });
});

describe('moon', () => {
  it('phase names by angle', () => {
    expect(phaseFromAngle(0)).toBe('new');
    expect(phaseFromAngle(355)).toBe('new');
    expect(phaseFromAngle(90)).toBe('first_quarter');
    expect(phaseFromAngle(180)).toBe('full');
    expect(phaseFromAngle(220)).toBe('waning_gibbous');
  });
  it('known full moon (2026-10-26) is full and bright', () => {
    const m = getMoonInfo(new Date('2026-10-26T04:12:00Z'));
    expect(m.phase).toBe('full');
    expect(m.illumination).toBeGreaterThan(98);
  });
  it('lunar day stays in 1..30 and starts before now', () => {
    for (const iso of ['2026-10-10T16:00:00Z', '2026-10-11T12:00:00Z', '2026-10-25T12:00:00Z', '2026-11-05T00:00:00Z']) {
      const d = new Date(iso);
      const m = getMoonInfo(d);
      expect(m.lunarDay).toBeGreaterThanOrEqual(1);
      expect(m.lunarDay).toBeLessThanOrEqual(30);
      expect(m.lunarDayStart.getTime()).toBeLessThanOrEqual(d.getTime());
      expect(m.nextFull.getTime()).toBeGreaterThan(d.getTime());
      expect(m.nextNew.getTime()).toBeGreaterThan(d.getTime());
      expect(m.signChangeAt.getTime()).toBeGreaterThan(d.getTime());
    }
  });
  it('daysUntil never negative', () => {
    expect(daysUntil(new Date(Date.now() - 5000))).toBe(0);
  });
});

describe('quotes', () => {
  it('has a big pool in all languages', () => {
    expect(QUOTE_COUNT).toBeGreaterThanOrEqual(150);
    for (let i = 0; i < QUOTE_COUNT; i++) {
      for (const l of ['ru', 'uk', 'en'] as const) expect(quoteAt(i, l).length).toBeGreaterThan(10);
    }
  });
});
