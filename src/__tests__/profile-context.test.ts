import { describe, it, expect } from 'vitest';
import { buildProfileContext, buildTarotSystemPrompt } from '@/lib/ai/prompts/system';

describe('buildProfileContext', () => {
  it('returns nothing when there is no profile', () => {
    expect(buildProfileContext(undefined, 'ru')).toBe('');
  });

  it('instructs feminine agreement for a female user (ru)', () => {
    const out = buildProfileContext({ name: 'Аня', gender: 'female' }, 'ru');
    expect(out).toContain('Аня');
    expect(out).toContain('женском роде');
    expect(out).not.toContain('мужском роде');
  });

  it('instructs masculine agreement for a male user (ru)', () => {
    const out = buildProfileContext({ name: 'Дима', gender: 'male' }, 'ru');
    expect(out).toContain('мужском роде');
    expect(out).not.toContain('женском роде');
  });

  it('asks to avoid gendered forms when gender is neutral or missing', () => {
    for (const gender of ['neutral', null, undefined]) {
      const out = buildProfileContext({ name: 'Саша', gender }, 'ru');
      expect(out).toContain('Избегай форм');
      expect(out).not.toContain('ОБЯЗАТЕЛЬНО');
    }
  });

  it('localizes the block for uk and en', () => {
    expect(buildProfileContext({ gender: 'female' }, 'uk')).toContain('жіночому');
    expect(buildProfileContext({ gender: 'male' }, 'en')).toContain('a man');
  });

  it('ignores a blank name', () => {
    const out = buildProfileContext({ name: '   ', gender: 'female' }, 'ru');
    expect(out).not.toContain('зовут');
  });
});

describe('buildTarotSystemPrompt', () => {
  it('stays backwards compatible without a profile', () => {
    const prompt = buildTarotSystemPrompt('ru');
    expect(prompt).toContain('Оракул Магии Карт');
    expect(prompt).not.toContain('С КЕМ ТЫ ГОВОРИШЬ');
  });

  it('appends the profile block after the memory block', () => {
    const prompt = buildTarotSystemPrompt('ru', 'память о человеке', { name: 'Аня', gender: 'female' });
    expect(prompt).toContain('ПАМЯТЬ ОБ ЭТОМ ЧЕЛОВЕКЕ');
    expect(prompt).toContain('С КЕМ ТЫ ГОВОРИШЬ');
    expect(prompt.indexOf('ПАМЯТЬ ОБ ЭТОМ ЧЕЛОВЕКЕ')).toBeLessThan(prompt.indexOf('С КЕМ ТЫ ГОВОРИШЬ'));
    expect(prompt).toContain('женском роде');
  });
});
