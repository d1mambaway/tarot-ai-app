'use client';

import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';

type L = 'ru' | 'uk' | 'en';

const T = {
  tarot: { ru: 'Таро и расклады', uk: 'Таро та розклади', en: 'Tarot & Spreads' },
  esoteric: { ru: 'Эзотерика', uk: 'Езотерика', en: 'Esoteric' },
  start: { ru: 'Начать', uk: 'Почати', en: 'Start' },
  free: { ru: 'Бесплатно', uk: 'Безкоштовно', en: 'Free' },
};

export default function SpreadListScreen({ category }: { category: SpreadCategory }) {
  const { locale, selectSpread } = useAppStore();
  const l = (locale || 'ru') as L;
  const filtered = SPREADS.filter((s) => s.category === category);
  const title = category === 'tarot' ? T.tarot[l] : T.esoteric[l];
  const icon = category === 'tarot' ? '🔮' : '✨';

  const headerImage = category === 'tarot' ? '/ui/tarot-header.webp' : '/ui/esoteric-header.webp';

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Category header image */}
      <div className="mb-4 rounded-2xl overflow-hidden border border-mystic-accent/20">
        <img src={headerImage} alt={title} className="w-full h-auto block" />
      </div>

      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">
        {icon} {title}
      </h1>

      <div className="space-y-3">
        {filtered.map((spread, i) => (
          <motion.div
            key={spread.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
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

                <span className="px-3 py-1.5 rounded-xl bg-mystic-accent/15 border border-mystic-accent/25
                                 text-xs font-bold text-mystic-accent">
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
