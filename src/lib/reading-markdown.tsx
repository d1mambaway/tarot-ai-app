/**
 * Renderer for the limited markdown the tarot AI writes (see the ОФОРМЛЕНИЕ
 * block in src/lib/ai/prompts/system.ts):
 *
 *  - "🌙 **Title**"                → section heading (emoji + gold display title)
 *  - "**Position** — **Card**"     → position heading: small lavender label + gold card name
 *  - "**Position** — **Card**: text" (older format) → same heading, text below
 *  - "**key thought**" inside text → gold highlight
 *  - "*phrase*" / "_phrase_" inside text → lavender italic
 *  - a line that is only "*phrase*" / "_phrase_" → the closing key line, set apart
 *
 * Older readings in history were written with CAPS labels ("⚡ ЭНЕРГЕТИЧЕСКОЕ
 * ЗНАЧЕНИЕ: text"). Those are rendered as a small label above the text instead
 * of shouting, so history looks as clean as new readings.
 */
import type { ReactNode } from 'react';

const EMOJI = '(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator})(?:\\uFE0F|\\u200D|\\p{Extended_Pictographic}|\\p{Emoji_Modifier})*';

// <prefix>**Position** — **Card**[: rest]
const POSITION_CARD_LINE = /^(.*?)\*\*(.+?)\*\*\s*[—–-]\s*\*\*(.+?)\*\*:?\s*(.*)$/;
// 🌙 **Title**  (optional trailing colon)
const HEADING_BOLD = new RegExp(`^(${EMOJI})?\\s*\\*\\*([^*]{1,80})\\*\\*\\s*:?$`, 'u');
// 🪐 Личные планеты   — short emoji line without bold or final punctuation
const HEADING_PLAIN = new RegExp(`^(${EMOJI})\\s*([^*.!?:;]{2,48})$`, 'u');
// ⚡ ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ (1-2 фразы):   — legacy all-caps heading on its own line
const HEADING_CAPS = new RegExp(`^(${EMOJI})?\\s*([^a-zа-яёіїєґ*:]{3,80}?)\\s*(?:\\([^)]*\\))?\\s*:?$`, 'u');
// ⚡ ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ: text          — legacy caps label starting a paragraph
const LABEL_CAPS = new RegExp(`^(${EMOJI})?\\s*([A-ZА-ЯЁІЇЄҐ][A-ZА-ЯЁІЇЄҐ0-9 ,/—–\\-]{2,60}?)\\s*(?:\\([^)]*\\))?:\\s+(.+)$`, 'u');

function hasLetters(s: string): boolean {
  return /\p{L}/u.test(s);
}

function isAllCaps(s: string): boolean {
  return hasLetters(s) && s === s.toUpperCase() && s !== s.toLowerCase();
}

/** "ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ" → "Энергетическое значение" */
function sentenceCase(s: string): string {
  const t = s.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// A whole line in italics: the closing "phrase to hear" of a reading
const KEY_LINE = /^(?:\*([^*]{3,200})\*|_([^_]{3,200})_)$/;

/**
 * Models sometimes put thin / narrow no-break spaces around dashes and
 * numbers; the font draws them almost zero-width ("Дар–проницательная").
 */
function normalizeSpaces(s: string): string {
  return s.replace(/[\u2009\u200A\u202F]/g, ' ');
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g).filter((t) => t.length > 0);
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={key} className="reading-highlight">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) && token.length > 2) {
      return (
        <em key={key} className="reading-emphasis">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

function Heading({ emoji, title, k }: { emoji?: string; title: string; k: number }) {
  return (
    <h3 key={k} className="reading-heading">
      {emoji && <span className="reading-heading-emoji" aria-hidden>{emoji}</span>}
      <span>{title}</span>
    </h3>
  );
}

/** Renders one paragraph (one line of the AI text) as React nodes. */
export function renderReadingParagraph(raw: string, key: number): ReactNode {
  const paragraph = normalizeSpaces(raw).trim();

  // The closing key phrase, alone on its line
  const kl = paragraph.match(KEY_LINE);
  if (kl) {
    return (
      <p key={key} className="reading-keyline">
        {(kl[1] ?? kl[2]).trim()}
      </p>
    );
  }

  // Position — Card (with or without text on the same line)
  const pos = paragraph.match(POSITION_CARD_LINE);
  if (pos && pos[2].length <= 60 && pos[3].length <= 60) {
    const [, prefix, position, card, rest] = pos;
    const heading = (
      <div key={`h${key}`} className="reading-position">
        <span className="reading-position-label">
          {prefix.replace(/[:\s]+$/, '').trim() ? `${prefix.trim()} ` : ''}
          {position}
        </span>
        <span className="reading-position-card">{card}</span>
      </div>
    );
    if (!rest) return heading;
    return (
      <div key={key}>
        {heading}
        <p className="reading-p mt-1.5">{renderInline(rest, `p${key}`)}</p>
      </div>
    );
  }

  // 🌙 **Title**
  const hb = paragraph.match(HEADING_BOLD);
  if (hb) {
    const title = isAllCaps(hb[2]) ? sentenceCase(hb[2]) : hb[2].trim();
    return <Heading key={key} k={key} emoji={hb[1]} title={title} />;
  }

  // 🪐 Личные планеты (heading written without bold)
  const hp = paragraph.match(HEADING_PLAIN);
  if (hp && !isAllCaps(hp[2])) {
    return <Heading key={key} k={key} emoji={hp[1]} title={hp[2].trim()} />;
  }

  // Legacy: "⚡ ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ:" alone on a line
  const hc = paragraph.match(HEADING_CAPS);
  if (hc && isAllCaps(hc[2]) && hc[2].trim().length >= 3) {
    return <Heading key={key} k={key} emoji={hc[1]} title={sentenceCase(hc[2])} />;
  }

  // Legacy: "⚡ ЭНЕРГЕТИЧЕСКОЕ ЗНАЧЕНИЕ: text…"
  const lc = paragraph.match(LABEL_CAPS);
  if (lc && isAllCaps(lc[2])) {
    return (
      <div key={key}>
        <span className="reading-label">{sentenceCase(lc[2])}</span>
        <p className="reading-p">{renderInline(lc[3], `p${key}`)}</p>
      </div>
    );
  }

  return (
    <p key={key} className="reading-p">
      {renderInline(paragraph, `p${key}`)}
    </p>
  );
}
