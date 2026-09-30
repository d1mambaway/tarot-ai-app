'use client';

/**
 * Gold line icons (lucide) used in the UI chrome instead of stock emoji, so
 * headers, rows and buttons share one thin, consistent style. Emoji stay in
 * AI reading text and spread names.
 */

import type { LucideIcon } from 'lucide-react';

type Tone = 'gold' | 'lavender' | 'muted' | 'green';

const TONE: Record<Tone, string> = {
  gold: 'text-mystic-gold',
  lavender: 'text-[#b9a7f0]',
  muted: 'text-mystic-muted',
  green: 'text-emerald-300',
};

/** Bare icon, sized to sit next to text */
export function Icon({
  icon: I,
  size = 18,
  tone = 'gold',
  className = '',
}: {
  icon: LucideIcon;
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  return <I size={size} strokeWidth={1.6} className={`${TONE[tone]} shrink-0 ${className}`} aria-hidden />;
}

/** Icon in a small gold medallion — for rows, cards and section headers */
export function IconBadge({
  icon,
  size = 36,
  tone = 'gold',
  className = '',
}: {
  icon: LucideIcon;
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`icon-badge shrink-0 inline-flex items-center justify-center rounded-xl ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon icon={icon} size={Math.round(size * 0.5)} tone={tone} />
    </span>
  );
}
