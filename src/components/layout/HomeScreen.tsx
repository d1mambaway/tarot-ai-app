'use client';

import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { getSpreadById } from '@/data/spreads';
import { motion } from 'framer-motion';

const CATEGORIES: { id: SpreadCategory; label: { ru: string; uk: string } }[] = [
  { id: 'tarot', label: { ru: '🃏 Таро и расклады', uk: '🃏 Таро і розклади' } },
  { id: 'mystic', label: { ru: '🔮 Мистика', uk: '🔮 Містика' } },
  { id: 'photo', label: { ru: '📸 По фото', uk: '📸 За фото' } },
  { id: 'personal', label: { ru: '🧠 Личное', uk: '🧠 Особисте' } },
];

export default function HomeScreen() {
  const { user, locale, selectSpread } = useAppStore();
  const l = locale || 'ru';

  const cardOfDay = getSpreadById('card_of_day')!;

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-3xl font-bold font-mystic text-gradient-gold">
          ✨ Магия Карт
        </h1>
        {user && (
          <p className="text-sm text-mystic-muted mt-1">
            {l === 'uk' ? `Вітаю, ${user.firstName}` : `Привет, ${user.firstName}`}
            {user.streakDays > 0 && (
              <span className="ml-2 text-mystic-accent">🔥 {user.streakDays} {l === 'uk' ? 'днів' : 'дней'}</span>
            )}
          </p>
        )}
      </motion.div>

      {/* Card of the Day — main CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => selectSpread(cardOfDay)}
        className="w-full mb-6 p-5 rounded-2xl bg-gradient-to-br from-mystic-purple/30 via-mystic-card to-mystic-blue/30 border border-mystic-accent/40 glow-strong text-left"
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-float">🌅</div>
          <div className="flex-1">
            <p className="font-bold text-lg text-mystic-accent font-mystic">
              {l === 'uk' ? 'Карта дня' : 'Карта дня'}
            </p>
            <p className="text-xs text-mystic-muted mt-0.5">
              {l === 'uk' ? 'Безкоштовно • Щоденне послання від карт' : 'Бесплатно • Ежедневное послание от карт'}
            </p>
          </div>
          <div className="text-mystic-accent text-2xl">→</div>
        </div>
      </motion.button>

      {/* Categories */}
      {CATEGORIES.map((cat, catIdx) => {
        const spreads = SPREADS.filter((s) => s.category === cat.id);
        if (spreads.length === 0) return null;

        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + catIdx * 0.05 }}
            className="mb-6"
          >
            <h2 className="text-base font-bold mb-3 text-mystic-text">
              {cat.label[l]}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {spreads.map((spread) => (
                <button
                  key={spread.id}
                  onClick={() => selectSpread(spread)}
                  className="p-3 rounded-xl bg-mystic-card/80 border border-mystic-accent/15 text-left hover:border-mystic-accent/40 hover:bg-mystic-card-hover transition-all relative group"
                >
                  {spread.isNew && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                      new
                    </span>
                  )}
                  <span className="text-2xl block mb-1">{spread.icon}</span>
                  <p className="text-sm font-semibold text-mystic-text leading-tight">
                    {spread.name[l].replace(/^[\S]+\s/, '')}
                  </p>
                  <p className="text-[10px] text-mystic-muted mt-1">
                    {spread.freePerDay === -1 || spread.freePerDay > 0
                      ? (l === 'uk' ? '✦ Безкоштовно' : '✦ Бесплатно')
                      : `⭐ ${spread.starsCost}`}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
