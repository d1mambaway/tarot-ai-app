/**
 * What a person told us about themselves in «Прочитай меня». Saved on the
 * user (User.profileFacts) so later readings can weave it in naturally,
 * the way a reader who "just knows" you would.
 */

import { db } from './db';

export interface PortraitAnswers {
  /** How to address them */
  name?: string;
  /** Age range, e.g. "26–30" */
  age?: string;
  /** Area of life that matters most now */
  focus?: string;
  /** Relationship status */
  relationship?: string;
  /** What they do: study, work, field */
  occupation?: string;
  /** What they'd change with a wave of a hand */
  wish?: string;
  /** Three words about themselves */
  words?: string;
  /** Biggest fear */
  fear?: string;
}

export const PORTRAIT_FIELDS: (keyof PortraitAnswers)[] = ['name', 'age', 'focus', 'relationship', 'occupation', 'wish', 'words', 'fear'];

const LIMITS: Record<keyof PortraitAnswers, number> = {
  name: 40, age: 20, focus: 60, relationship: 60, occupation: 120, wish: 300, words: 120, fear: 120,
};

/** Keep known fields only, as trimmed single-line strings of sane length */
export function sanitizePortrait(raw: unknown): PortraitAnswers | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: PortraitAnswers = {};
  for (const key of PORTRAIT_FIELDS) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v !== 'string') continue;
    const clean = v.replace(/\s+/g, ' ').trim().slice(0, LIMITS[key]);
    if (clean) out[key] = clean;
  }
  return Object.keys(out).length >= 3 ? out : null;
}

export async function saveProfileFacts(userId: string, facts: PortraitAnswers): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { profileFacts: { ...facts, updatedAt: new Date().toISOString() } },
  });
}

const LABELS: Record<keyof PortraitAnswers, string> = {
  name: 'Как обращаться',
  age: 'Возраст',
  focus: 'Что волнует больше всего',
  relationship: 'В отношениях',
  occupation: 'Чем занимается',
  wish: 'Что хотел(а) бы изменить',
  words: 'Описывает себя словами',
  fear: 'Главный страх',
};

/** The facts as prompt lines, or undefined when there are none */
export function formatProfileFacts(raw: unknown): string | undefined {
  const facts = sanitizePortrait(raw);
  if (!facts) return undefined;
  return PORTRAIT_FIELDS.filter((k) => facts[k]).map((k) => `- ${LABELS[k]}: ${facts[k]}`).join('\n');
}
