import { describe, it, expect } from 'vitest';
import {
  calculateDestinyMatrix,
  parseBirthDate,
  reduceToArcana,
  arcanaName,
  arcanaImage,
  formatMatrixForPrompt,
} from '@/lib/matrix';
import { renderMatrixSVG } from '@/lib/matrix-svg';

describe('reduceToArcana', () => {
  it('keeps values already inside 1..22', () => {
    expect(reduceToArcana(1)).toBe(1);
    expect(reduceToArcana(22)).toBe(22);
    expect(reduceToArcana(15)).toBe(15);
  });

  it('sums digits until the value fits the arcana range', () => {
    expect(reduceToArcana(23)).toBe(5);
    expect(reduceToArcana(38)).toBe(11);
    expect(reduceToArcana(1995)).toBe(6); // 24 -> 6
  });

  it('never returns 0 — the Fool is numbered 22', () => {
    expect(reduceToArcana(0)).toBe(22);
  });
});

describe('parseBirthDate', () => {
  it('accepts DD.MM.YYYY and YYYY-MM-DD', () => {
    expect(parseBirthDate('15.07.1995')).toEqual({ day: 15, month: 7, year: 1995 });
    expect(parseBirthDate('1995-07-15')).toEqual({ day: 15, month: 7, year: 1995 });
  });

  it('rejects impossible dates', () => {
    expect(() => parseBirthDate('31.02.1995')).toThrow();
    expect(() => parseBirthDate('15.13.1995')).toThrow();
    expect(() => parseBirthDate('tomorrow')).toThrow();
  });
});

describe('calculateDestinyMatrix', () => {
  const m = calculateDestinyMatrix('15.07.1995');

  it('derives the outer diamond from the birth date', () => {
    expect(m.A).toBe(15); // day
    expect(m.B).toBe(7); // month
    expect(m.C).toBe(6); // 1+9+9+5 = 24 -> 6
    expect(m.D).toBe(10); // 15+7+6 = 28 -> 10
    expect(m.E).toBe(11); // 15+7+6+10 = 38 -> 11
  });

  it('derives the diagonal square from neighbouring points', () => {
    expect(m.F).toBe(22); // A+B
    expect(m.G).toBe(13); // B+C
    expect(m.H).toBe(16); // C+D
    expect(m.I).toBe(7); // D+A = 25 -> 7
  });

  it('keeps every position inside the arcana range', () => {
    const values = [
      m.A, m.B, m.C, m.D, m.E, m.F, m.G, m.H, m.I,
      m.personalPurpose, m.socialPurpose, m.spiritualPurpose,
      m.moneyTalent, m.moneyKarmicTail, m.moneyPoint,
      m.loveTalent, m.loveKarmicTail, m.lovePoint,
      m.maleLine, m.femaleLine,
    ];
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(22);
    }
  });

  it('is deterministic — same date, same chart', () => {
    expect(calculateDestinyMatrix('1995-07-15')).toEqual(m);
  });

  it('normalises the date for display', () => {
    expect(calculateDestinyMatrix('5.7.1995').input.date).toBe('05.07.1995');
  });
});

describe('arcana lookups', () => {
  it('maps every value 1..22 to a name and an existing artwork path', () => {
    for (let v = 1; v <= 22; v++) {
      expect(arcanaName(v)).not.toBe('');
      expect(arcanaImage(v)).toMatch(/^\/cards\/major\/\d{2}-[a-z-]+\.webp$/);
    }
  });

  it('renders the Fool for 22', () => {
    expect(arcanaName(22)).toBe('Шут');
    expect(arcanaImage(22)).toBe('/cards/major/00-fool.webp');
  });
});

describe('prompt and SVG output', () => {
  const m = calculateDestinyMatrix('15.07.1995');

  it('hands the AI finished numbers, never raw dates to compute', () => {
    const text = formatMatrixForPrompt(m);
    expect(text).toContain('15.07.1995');
    expect(text).toContain('Комета');
    expect(text).toContain('ДЕНЕЖНЫЙ КАНАЛ');
  });

  it('renders a self-contained SVG with all nine chart values', () => {
    const svg = renderMatrixSVG(m);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('/cards/major/');
    for (const v of [m.A, m.B, m.C, m.D, m.E]) {
      expect(svg).toContain(`>${v}</text>`);
    }
  });
});
