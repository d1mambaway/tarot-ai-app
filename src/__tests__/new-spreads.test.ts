import { describe, expect, it } from 'vitest';
import { moonSpreadWindow, MOON_WINDOW_HOURS } from '@/lib/moon';
import { sanitizePortrait, formatProfileFacts } from '@/lib/profile-facts';
import { buildReadingPrompt } from '@/lib/ai/prompts/tarot';
import { buildImagePrompt } from '@/lib/ai/image';
import { SPREADS, getSpreadById } from '@/data/spreads';

const H = 3600 * 1000;

describe('moonSpreadWindow', () => {
  it('is open 36 h either side of the exact moon and closed outside', () => {
    for (const kind of ['new', 'full'] as const) {
      const { exact } = moonSpreadWindow(kind, new Date('2026-10-01T00:00:00Z'));
      expect(moonSpreadWindow(kind, exact).open).toBe(true);
      expect(moonSpreadWindow(kind, new Date(exact.getTime() + (MOON_WINDOW_HOURS - 1) * H)).open).toBe(true);
      expect(moonSpreadWindow(kind, new Date(exact.getTime() - (MOON_WINDOW_HOURS - 1) * H)).open).toBe(true);
      const after = moonSpreadWindow(kind, new Date(exact.getTime() + (MOON_WINDOW_HOURS + 1) * H));
      expect(after.open).toBe(false);
      // next window is about a lunar month later
      expect(after.opensAt.getTime() - exact.getTime()).toBeGreaterThan(25 * 24 * H);
    }
  });
});

describe('«Прочитай меня» answers', () => {
  it('keeps known fields, trims them, drops junk, needs at least three', () => {
    const p = sanitizePortrait({ name: '  Аня  ', age: '25–30', focus: 'Любовь', hack: 'x', wish: 'a'.repeat(900) });
    expect(p).toEqual({ name: 'Аня', age: '25–30', focus: 'Любовь', wish: 'a'.repeat(300) });
    expect(sanitizePortrait({ name: 'Аня' })).toBeNull();
    expect(sanitizePortrait('nope')).toBeNull();
  });

  it('formats facts for the reading memory', () => {
    const text = formatProfileFacts({ name: 'Аня', age: '25–30', fear: 'Остаться одному', updatedAt: 'x' });
    expect(text).toContain('Как обращаться: Аня');
    expect(text).toContain('Главный страх: Остаться одному');
    expect(text).not.toContain('updatedAt');
  });
});

describe('new spreads', () => {
  const card = (name: string) => ({ name, reversed: false, keywords: ['k'] });

  it('are configured with a matching card count and cover', () => {
    for (const id of ['love_future', 'ex_return', 'two_paths', 'card_advice', 'year_ahead', 'new_moon', 'full_moon']) {
      const s = getSpreadById(id)!;
      expect(s, id).toBeTruthy();
      expect(s.image, id).toMatch(/^\/ui\/spreads\/.+\.webp$/);
      if (s.positions) expect(s.positions.length, id).toBe(s.cardCount);
      expect(buildImagePrompt({ spreadId: id, cards: [card('X')] }), id).toBeTruthy();
    }
    expect(SPREADS.filter((s) => s.moonEvent).map((s) => s.id)).toEqual(['new_moon', 'full_moon']);
  });

  it('get their own prompts', () => {
    const two = buildReadingPrompt({ spreadId: 'two_paths', spreadType: 'x', cards: Array(5).fill(card('Шут')), question: 'Первый путь: остаться\nВторой путь: уехать', locale: 'ru' });
    expect(two).toContain('Второй путь: уехать');
    expect(two).toContain('Путь Б');

    const year = buildReadingPrompt({ spreadId: 'year_ahead', spreadType: 'x', cards: Array(13).fill(card('Маг')), locale: 'ru' });
    expect(year).toContain('Карта года: Маг');
    expect(year.match(/: Маг/g)!.length).toBe(13);

    const ex = buildReadingPrompt({ spreadId: 'ex_return', spreadType: 'x', cards: Array(5).fill(card('Луна')), question: 'Дима', locale: 'ru' });
    expect(ex).toContain('Дима');
    expect(buildReadingPrompt({ spreadId: 'new_moon', spreadType: 'x', cards: Array(3).fill(card('Звезда')), locale: 'ru' })).toContain('новолуние');
  });
});
