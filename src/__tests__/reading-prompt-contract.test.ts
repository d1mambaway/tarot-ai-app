import { describe, expect, it } from 'vitest';
import { buildReadingPrompt } from '@/lib/ai/prompts/tarot';
import { buildTarotSystemPrompt } from '@/lib/ai/prompts/system';

const card = { name: 'Восьмёрка Кубков', reversed: true, keywords: ['застревание'], position: 'Что мешает' };
const prompt = (spreadId: string, count = 1) => buildReadingPrompt({
  spreadId, spreadType: 'Тестовый расклад', locale: 'ru',
  question: 'Стоит ли продолжать отношения?',
  cards: Array.from({ length: count }, () => card),
});

describe('reading prompt contracts', () => {
  it.each(['yes_no', 'free_question', 'card_advice'])('%s retains the question and supplied card', (id) => {
    const result = prompt(id);
    expect(result).toContain('Стоит ли продолжать отношения?');
    expect(result).toContain(card.name);
    expect(result).toContain('перевёрнута');
    expect(result).not.toContain('Ответ: 2-3 предложения');
  });
  it('does not confuse a calendar week with tomorrow', () => {
    const result = prompt('weekly', 7);
    expect(result).toContain('с понедельника по воскресенье');
    expect(result).not.toContain('начиная с завтра');
  });
  it.each(['new_moon', 'full_moon'])('%s gives action rather than a mandatory ritual', (id) => {
    const result = prompt(id, 4);
    expect(result).not.toContain('**Ритуал');
    expect(result).not.toContain('порвать или сжечь');
    expect(result).not.toContain('записать намерение при свече');
  });
  it('keeps detailed formats for larger paid readings', () => {
    expect(prompt('what_they_think', 3)).toContain('280-450');
    expect(prompt('ex_return', 5)).toContain('400-600');
    expect(prompt('celtic_cross', 10)).toContain('500-850');
  });
  it('does not equate a reversed card with a secret wish to return', () => {
    expect(prompt('ex_return', 5)).not.toContain('Перевёрнутая карта здесь = думает');
  });
  it.each(['ru', 'uk', 'en'] as const)('retains locale, profile, and bounds for %s', (locale) => {
    const result = buildTarotSystemPrompt(locale, 'Предыдущий вопрос', { name: 'Оксана', gender: 'female' });
    expect(result).toContain('Оксана');
    expect(result).toContain('Предыдущий вопрос');
    expect(result).toContain('не ставь диагнозы');
    expect(result).toContain('Не выдумывай события');
    expect(result).toContain('Не предлагай автоматически');
  });
});
