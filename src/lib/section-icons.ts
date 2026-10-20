/**
 * Heading emoji → brand section icon (public/icons/sections/<id>.svg).
 *
 * The prompts (system.ts) give the model ONE emoji per section meaning, so a
 * heading emoji maps to an icon exactly. Old readings in history were written
 * with a free emoji palette where 💫 🌙 ✨ 🔮 ⭐ ⚖️ 💚 … meant different things
 * in different answers; those are deliberately NOT in this table and keep
 * showing as emoji. Only emoji that always meant one thing are mapped.
 */

/** Current markers, the ones system.ts asks for */
const CURRENT: Record<string, string> = {
  '✅': 'advice',
  '⚠': 'warning',
  '👁': 'message',
  '🪷': 'spirit',
  '🌒': 'cycles',
  '🧭': 'path',
  '💠': 'elements',
  '🖤': 'shadow',
  '🔗': 'connection',
  '🏹': 'outcome',
  '💞': 'love',
  '💼': 'money',
  '🚪': 'opportunity',
  '🔑': 'key',
  '🌄': 'morning',
  '🎭': 'persona',
  '💔': 'turning-point',
  '🌳': 'ancestry',
  '🔭': 'planets',
  '🔯': 'destiny-matrix',
  '🔥': 'fire',
  '🌊': 'water',
  '🪨': 'earth',
  '🌬': 'air',
  // Chakra spread (CHAKRA_META in esoteric.ts)
  '🔴': 'chakra-root',
  '🟠': 'chakra-sacral',
  '🟡': 'chakra-solar',
  '🟢': 'chakra-heart',
  '🔵': 'chakra-throat',
  '🟣': 'chakra-third-eye',
  '👑': 'chakra-crown',
};

/** Older fixed-template markers that only ever had one meaning */
const LEGACY: Record<string, string> = {
  '❌': 'warning',
  '💝': 'love',
  '💰': 'money',
  '🏠': 'money',
  '🍀': 'opportunity',
  '👤': 'persona',
  '🕰': 'cycles',
  '🎁': 'outcome',
  '💧': 'water',
};

const ICONS: Record<string, string> = { ...LEGACY, ...CURRENT };

/** Section icon id for a heading emoji, or null to keep the emoji as is. */
export function sectionIconFor(emoji: string | undefined): string | null {
  if (!emoji) return null;
  // Drop variation selectors so "⚠️" and "⚠" are the same key
  return ICONS[emoji.replace(/️/g, '')] ?? null;
}

export function sectionIconSrc(id: string): string {
  return `/icons/sections/${id}.svg`;
}
