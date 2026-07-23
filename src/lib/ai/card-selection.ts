/**
 * AI-guided card selection — shared between /api/reading and /api/reading-lite
 * so both endpoints get the same quality of card picking instead of drifting
 * apart (previously duplicated inline in reading-lite only).
 */

import { callGrokJSON } from './clients';
import { buildCardSelectionPrompt } from './prompts';
import { ALL_CARDS, drawCards } from '@/data/tarot-cards';

type Locale = 'ru' | 'uk' | 'en';

/** Build a compact deck summary for the AI card-selection step */
export function buildDeckSummary(locale: Locale): string {
  return ALL_CARDS.map((c) => {
    const kw = c.keywords[locale]?.slice(0, 2).join(', ') || '';
    return `${c.id}: ${c.name[locale]}${kw ? ` (${kw})` : ''}`;
  }).join('\n');
}

/**
 * AI-guided card selection: asks the AI to choose cards that best answer the
 * question. Falls back to random draw if the AI response is unparseable.
 */
export async function aiPickCards(
  count: number,
  question: string | undefined,
  spreadType: string,
  positions: string[] | undefined,
  locale: Locale,
): Promise<{ id: number; reversed: boolean }[]> {
  try {
    const deckSummary = buildDeckSummary(locale);
    const prompt = buildCardSelectionPrompt({
      count,
      question,
      spreadType,
      positions,
      deckSummary,
      locale,
    });

    const raw = await callGrokJSON(
      [
        { role: 'system', content: 'Ты таролог. Отвечай ТОЛЬКО валидным JSON.' },
        { role: 'user', content: prompt },
      ],
      500,
    );

    const parsed = JSON.parse(raw);
    if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length >= count) {
      const validCards = parsed.cards
        .filter((c: any) => typeof c.id === 'number' && c.id >= 0 && c.id <= 77)
        .slice(0, count);

      if (validCards.length === count) {
        return validCards.map((c: any) => ({ id: c.id, reversed: !!c.reversed }));
      }
    }
  } catch (e) {
    console.error('AI card selection failed, using random:', e);
  }

  // Fallback: random draw
  return drawCards(count).map((c) => ({ id: c.id, reversed: c.reversed }));
}
