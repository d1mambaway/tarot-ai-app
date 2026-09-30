'use client';

/**
 * Price of a spread for the current user.
 * Premium sees the regular price struck through and a gold 0, so the value
 * of the subscription is visible on every spread instead of a bare crown.
 */

import ManaIcon from './ManaIcon';
import type { EffectivePrice } from '@/lib/pricing';

type L = 'ru' | 'uk' | 'en';

const T = {
  free: { ru: 'Бесплатно', uk: 'Безкоштовно', en: 'Free' },
  firstFree: { ru: 'первый — бесплатно', uk: 'перший — безкоштовно', en: 'first one free' },
  premiumOnly: { ru: 'Premium', uk: 'Premium', en: 'Premium' },
  monthly: { ru: 'в Premium раз в месяц', uk: 'у Premium раз на місяць', en: 'monthly in Premium' },
};

export default function PriceTag({ price, locale, size = 'sm', compact = false }: { price: EffectivePrice; locale: L; size?: 'sm' | 'md'; compact?: boolean }) {
  const text = size === 'md' ? 'text-sm' : 'text-[11px]';

  if (price.kind === 'free') {
    return <span className={`${text} text-emerald-300/90`}>✦ {T.free[locale]}</span>;
  }

  if (price.kind === 'premium' || price.kind === 'premium_big') {
    return (
      <span className={`${text} inline-flex items-center gap-1 whitespace-nowrap`} title={price.kind === 'premium_big' ? T.monthly[locale] : undefined}>
        <span className="line-through decoration-mystic-gold/70 text-mystic-muted/70">{price.base}</span>
        <span className="premium-price font-bold">0</span>
        <span aria-hidden>👑</span>
      </span>
    );
  }

  if (price.kind === 'first_free') {
    return (
      <span className={`${text} inline-flex items-center gap-1 whitespace-nowrap`}>
        <span className="line-through text-mystic-muted/70">{price.base}</span>
        <span className="text-emerald-300 font-bold">0</span>
        {!compact && <span className="text-emerald-300/80">· {T.firstFree[locale]}</span>}
      </span>
    );
  }

  if (price.kind === 'premium_only') {
    return <span className={`${text} font-bold whitespace-nowrap`}>👑 <span className="premium-price">{T.premiumOnly[locale]}</span></span>;
  }

  return (
    <span className={`${text} inline-flex items-center gap-0.5 whitespace-nowrap`}>
      <ManaIcon size="sm" /> {price.cost}
    </span>
  );
}
