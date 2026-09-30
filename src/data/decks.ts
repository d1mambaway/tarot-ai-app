/**
 * Tarot decks. Card meanings are shared (card ids 0–77 are the same in every
 * deck); a deck only changes the art. The user's active deck is User.deckId;
 * readings, the card of the day and the collection use it.
 *
 * ── Adding a deck ──────────────────────────────────────────────────────────
 * 1. Put 78 images at public/decks/<id>/00.webp … 77.webp (same size, 2:3),
 *    the back at public/decks/<id>/back.webp.
 *    Order: 00–21 Major Arcana (Fool…World), 22–35 Wands, 36–49 Cups,
 *    50–63 Swords, 64–77 Pentacles; in each suit Ace…10, Page, Knight,
 *    Queen, King.
 * 2. Set `available: true` below and fill its name.
 */

import type { TarotCard } from './tarot-cards';

type L3 = { ru: string; uk: string; en: string };

export interface Deck {
  id: string;
  name: L3;
  /** Card back */
  back: string;
  /** The deck's face in the deck picker */
  cover: string;
  /** false: shown as "coming soon", cannot be chosen */
  available: boolean;
  /** Image for a card of this deck */
  image: (card: Pick<TarotCard, 'id' | 'image'>) => string;
}

export const DEFAULT_DECK_ID = 'classic';

export const DECKS: Deck[] = [
  {
    id: 'classic',
    name: { ru: 'Магия Карт', uk: 'Магія Карт', en: 'Magic of Cards' },
    back: '/ui/card-back.webp',
    cover: '/cards/major/00-fool.webp',
    available: true,
    image: (card) => card.image,
  },
  {
    id: 'new',
    name: { ru: 'Ренессанс', uk: 'Ренесанс', en: 'Renaissance' },
    back: '/ui/card-back.webp',
    cover: '/decks/new/00.webp',
    available: true,
    image: (card) => `/decks/new/${String(card.id).padStart(2, '0')}.webp`,
  },
];

export function getDeck(id: string | null | undefined): Deck {
  return DECKS.find((d) => d.id === id && d.available) ?? DECKS[0];
}

/** A deck id a user may switch to */
export function isSelectableDeck(id: unknown): id is string {
  return typeof id === 'string' && DECKS.some((d) => d.id === id && d.available);
}

/** Art for a card in a given deck (falls back to the classic art) */
export function cardImage(card: Pick<TarotCard, 'id' | 'image'>, deckId: string | null | undefined): string {
  return getDeck(deckId).image(card);
}
