'use client';

import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ManaIcon from '@/components/ui/ManaIcon';

type L = 'ru' | 'uk' | 'en';

const T = {
  tarot: { ru: 'Таро и расклады', uk: 'Таро та розклади', en: 'Tarot & Spreads' },
  esoteric: { ru: 'Эзотерика', uk: 'Езотерика', en: 'Esoteric' },
  start: { ru: 'Начать', uk: 'Почати', en: 'Start' },
  free: { ru: 'Бесплатно', uk: 'Безкоштовно', en: 'Free' },
  cardOfDay: { ru: 'Карта дня', uk: 'Карта дня', en: 'Card of the Day' },
  cardOfDaySub: {
    ru: 'Бесплатно • Ежедневное послание от карт',
    uk: 'Безкоштовно • Щоденне послання від карт',
    en: 'Free • Your daily message from the cards',
  },
};

export default function SpreadListScreen({ category }: { category: SpreadCategory }) {
  const { locale, selectSpread } = useAppStore();
  const l = (locale || 'ru') as L;
  const filtered = SPREADS.filter((s) => s.category === category);
  const title = category === 'tarot' ? T.tarot[l] : T.esoteric[l];

  const headerImage =
    category === 'tarot' ? '/ui/tarot-header.webp' : '/ui/esoteric-header.webp';

  // Separate Card of Day from other spreads
  const cardOfDay = filtered.find((s) => s.id === 'card_of_day');
  const otherSpreads = filtered.filter((s) => s.id !== 'card_of_day');

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Category header image */}
      <div className="mb-4 rounded-2xl overflow-hidden">
        <img src={headerImage} alt={title} className="w-full h-auto block" />
      </div>

      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">{title}</h1>

      {/* ── Card of Day — special section (like HomeScreen) ────────── */}
      {cardOfDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => selectSpread(cardOfDay)}
          className="mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-mystic-purple/30 via-mystic-card to-mystic-blue/30 border border-mystic-accent/40 glow-strong cursor-pointer active:scale-[0.98] transition-transform"
        >
          {/* Banner image */}
          <img
            src="/ui/card-of-day-header.webp"
            alt="Card of Day"
            className="w-full h-auto block"
          />

          {/* Bouncing card + info */}
          <div className="p-3 flex items-center gap-3">
            <div className="w-[80px] h-[80px] relative flex-shrink-0 animate-float">
              <Image
                src={cardOfDay.image || '/ui/card-of-day.png'}
                alt="Card of Day"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-mystic-accent font-mystic">
                {T.cardOfDay[l]}
              </p>
              <p className="text-xs text-mystic-muted mt-0.5">{T.cardOfDaySub[l]}</p>
            </div>
            <div className="relative text-mystic-accent text-2xl">
              →
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Other spreads ───────────────────────────────────────── */}
      <div className="space-y-3">
        {otherSpreads.map((spread, i) => (
          <motion.div
            key={spread.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (cardOfDay ? 0.1 : 0) + i * 0.04, duration: 0.35 }}
            onClick={() => selectSpread(spread)}
            className="bg-mystic-card/80 rounded-2xl border border-mystic-accent/20 overflow-hidden
                       active:scale-[0.98] transition-transform cursor-pointer"
          >
            {/* Image */}
            {spread.image ? (
              <img
                src={spread.image}
                alt=""
                className="w-full h-auto block"
                loading={i < 4 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="py-8 text-center text-4xl">{spread.icon}</div>
            )}

            {/* Info bar */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-mystic-text truncate">
                  {spread.name[l]}
                </p>
                <p className="text-[11px] text-mystic-muted mt-0.5 line-clamp-1">
                  {spread.description[l]}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {spread.manaCost > 0 ? (
                  <span className="text-xs font-bold text-mystic-accent flex items-center gap-1">
                    {spread.manaCost} <ManaIcon size="sm" />
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-green-400">{T.free[l]}</span>
                )}

                <span
                  className="px-3 py-1.5 rounded-xl bg-mystic-accent/15 border border-mystic-accent/25
                                 text-xs font-bold text-mystic-accent"
                >
                  {T.start[l]}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
