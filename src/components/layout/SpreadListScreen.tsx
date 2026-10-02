'use client';

import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { motion } from 'framer-motion';
import PriceTag from '@/components/ui/PriceTag';
import { effectivePrice } from '@/lib/pricing';
import CardOfDaySection from '@/components/ui/CardOfDaySection';
import { moonSpreadWindow } from '@/lib/moon';

type L = 'ru' | 'uk' | 'en';

const T = {
  tarot: { ru: 'Таро и расклады', uk: 'Таро та розклади', en: 'Tarot & Spreads' },
  esoteric: { ru: 'Эзотерика', uk: 'Езотерика', en: 'Esoteric' },
  start: { ru: 'Начать', uk: 'Почати', en: 'Start' },
  free: { ru: 'Бесплатно', uk: 'Безкоштовно', en: 'Free' },
  popular: { ru: 'Популярное', uk: 'Популярне', en: 'Popular' },
  isNew: { ru: 'Новое', uk: 'Нове', en: 'New' },
  openUntil: { ru: 'Открыт до', uk: 'Відкритий до', en: 'Open until' },
  opensOn: { ru: 'Откроется', uk: 'Відкриється', en: 'Opens' },
};

const fmtDay = (d: Date, l: L) =>
  d.toLocaleDateString(l === 'uk' ? 'uk-UA' : l === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long' });


export default function SpreadListScreen({ category }: { category: SpreadCategory }) {
  const { locale, selectSpread, user } = useAppStore();
  const isPremium = user?.isPremium ?? false;
  const l = (locale || 'ru') as L;
  const inTab = SPREADS.filter((s) => s.id !== 'card_of_day' && s.category === category);
  // Order: «Прочитай меня» (opens the esoteric tab) and an open moon spread, new ones, the rest, closed moon spreads (dimmed)
  const moon = new Map(inTab.filter((s) => s.moonEvent).map((s) => [s.id, moonSpreadWindow(s.moonEvent!)]));
  const filtered = [
    ...inTab.filter((s) => s.id === 'psych_portrait' || moon.get(s.id)?.open),
    // New spreads right under the card of the day, so they get noticed
    ...inTab.filter((s) => s.id !== 'psych_portrait' && !s.moonEvent && s.isNew),
    ...inTab.filter((s) => s.id !== 'psych_portrait' && !s.moonEvent && !s.isNew),
    ...inTab.filter((s) => s.moonEvent && !moon.get(s.id)?.open),
  ];
  const locked = (id: string) => moon.has(id) && !moon.get(id)!.open;
  const title = category === 'tarot' ? T.tarot[l] : T.esoteric[l];

  const headerImage =
    category === 'tarot' ? '/ui/tarot-header.webp' : '/ui/esoteric-header.webp';

  // Only show Card of Day in the tarot tab
  const showCardOfDay = category === 'tarot';

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Category header image — half size */}
      <div className="mb-4 rounded-2xl overflow-hidden">
        <img src={headerImage} alt={title} className="w-full h-auto block" style={{ maxHeight: '80px', objectFit: 'cover' }} />
      </div>

      <h1 className="t-screen mb-4">{title}</h1>

      {/* Card of Day — identical to HomeScreen */}
      {showCardOfDay && <CardOfDaySection />}

      {/* Other spreads */}
      <div className="space-y-3">
        {filtered.map((spread, i) => (
          <motion.div
            key={spread.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (showCardOfDay ? 0.1 : 0) + i * 0.04, duration: 0.3 }}
            onClick={() => { if (!locked(spread.id)) selectSpread(spread); }}
            className={`brand-card overflow-hidden transition-transform relative ${locked(spread.id) ? 'opacity-55' : 'active:scale-[0.98] cursor-pointer'}`}
            style={spread.isPopular || moon.get(spread.id)?.open ? { borderColor: 'rgba(212,175,55,0.38)' } : undefined}
          >
            {/* Limited moon spread: open until / opens on */}
            {moon.has(spread.id) && (
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-micro font-semibold tracking-wide
                              bg-night-900/75 border border-mystic-gold/40 text-gold-soft backdrop-blur-sm">
                {moon.get(spread.id)!.open
                  ? `${T.openUntil[l]} ${fmtDay(moon.get(spread.id)!.closesAt, l)}`
                  : `${T.opensOn[l]} ${fmtDay(moon.get(spread.id)!.opensAt, l)}`}
              </div>
            )}
            {spread.isNew && !spread.isPopular && !moon.has(spread.id) && (
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-micro font-semibold tracking-wide
                              bg-night-900/75 border border-mystic-gold/40 text-gold-soft backdrop-blur-sm">
                {T.isNew[l]}
              </div>
            )}
            {/* Popular badge */}
            {spread.isPopular && (
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-micro font-semibold tracking-wide
                              bg-night-900/75 border border-mystic-gold/40 text-gold-soft backdrop-blur-sm">
                {T.popular[l]}
              </div>
            )}

            {/* Image */}
            {spread.image ? (
              <img
                src={spread.image}
                alt=""
                className="w-full h-[112px] object-cover block"
                loading={i < 4 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="py-8 text-center text-4xl">{spread.icon}</div>
            )}

            {/* Info: full-width title and description, then price + start */}
            <div className="px-4 pt-3 pb-3">
              <p className="t-section">
                {spread.name[l].replace(/^[^\p{L}\p{N}]+/u, '').trim()}
              </p>
              <p className="text-sm text-mystic-muted mt-0.5 leading-snug line-clamp-2">
                {spread.description[l]}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-mystic-accent min-w-0">
                  <PriceTag price={effectivePrice(spread, user)} locale={l} size="md" />
                </span>
                {!locked(spread.id) && (
                  <span
                    className="shrink-0 px-4 py-1.5 rounded-xl bg-mystic-accent/15 border border-mystic-accent/25
                                   text-sm font-bold text-mystic-accent"
                  >
                    {T.start[l]}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
