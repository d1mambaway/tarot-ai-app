/**
 * Lightweight renderer for the limited markdown the tarot AI produces inside
 * a reading's interpretation text: **bold** / *emphasis* markers, plus a
 * special two-color "**Position** — **Card**: text" line pattern used for
 * per-position breakdowns (Celtic Cross, weekly, career/money, etc).
 *
 * The AI is instructed (see src/lib/ai/prompts/system.ts) to always wrap a
 * position label and its card name in `**...**` on their own line separated
 * by an em dash. We detect that pattern and render the position in one
 * accent color and the card name in another; everything else just becomes
 * plain bold with no literal asterisks shown.
 */
import type { ReactNode } from 'react';

// Matches: <anything, e.g. leading emoji/colon> **Position** – **Card**: rest
const POSITION_CARD_LINE = /^(.*?)\*\*(.+?)\*\*\s*[—–-]\s*\*\*(.+?)\*\*:?\s*(.*)$/;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter((t) => t.length > 0);
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={key} className="font-bold text-mystic-gold">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <strong key={key} className="font-bold">
          {token.slice(1, -1)}
        </strong>
      );
    }
    return token;
  });
}

/** Renders one paragraph of reading text as React nodes (no literal *stars*). */
export function renderReadingParagraph(paragraph: string, key: number): ReactNode {
  const match = paragraph.match(POSITION_CARD_LINE);
  if (match) {
    const [, prefix, position, card, rest] = match;
    return (
      <p key={key} className="text-sm text-mystic-text/90 leading-relaxed">
        {prefix}
        <strong className="font-bold text-mystic-purple">{position}</strong>
        {' — '}
        <strong className="font-bold text-mystic-gold">{card}</strong>
        {rest ? <>: {renderInline(rest, `p${key}`)}</> : null}
      </p>
    );
  }

  return (
    <p key={key} className="text-sm text-mystic-text/90 leading-relaxed">
      {renderInline(paragraph, `p${key}`)}
    </p>
  );
}
