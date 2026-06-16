'use client';

import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { motion } from 'framer-motion';

const CATEGORIES: { id: SpreadCategory; label: { ru: string; uk: string }; icon: string }[] = [
  { id: 'tarot', label: { ru: '🃏 Таро', uk: '🃏 Таро' }, icon: '🃏' },
  { id: 'mystic', label: { ru: '🔮 Мистика', uk: '🔮 Містика' }, icon: '🔮' },
  { id: 'photo', label: { ru: '📸 По фото', uk: '📸 За фото' }, icon: '📸' },
  { id: 'personal', label: { ru: '🧠 Личное', uk: '🧠 Особисте' }, icon: '🧠' },
];

export default function HomeScreen() {
  const { user, locale, setScreen } = useAppStore();
  const l = locale || 'ru';

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h1 className="text-2xl font-bold text-mystic-accent font-mystic">
          {l === 'uk' ? '✨ Таро AI' : '✨ Таро AI'}
        </h1>
        {user && (
          <p className="text-sm text-mystic-muted mt-1">
            {l === 'uk' ? `Вітаю, ${user.firstName}` : `Привет, ${user.firstName}`}
            {user.streakDays > 0 && ` 🔥 ${user.streakDays}`}
          </p>
        )}
      </motion.div>

      {/* Quick action: Card of the Day */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => {
          // TODO: set selected spread to card_of_day and navigate
          setScreen('spread');
        }}
        className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-mystic-purple/40 to-mystic-blue/40 border border-mystic-accent/30 glow text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌅</span>
          <div>
            <p className="font-bold text-mystic-accent">
              {l === 'uk' ? 'Карта дня' : 'Карта дня'}
            </p>
            <p className="text-xs text-mystic-muted">
              {l === 'uk' ? 'Безкоштовно • Щоденне послання' : 'Бесплатно • Ежедневное послание'}
            </p>
          </div>
          <span className="ml-auto text-mystic-accent">→</span>
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
            <h2 className="text-lg font-bold mb-3 text-mystic-text">
              {cat.label[l]}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {spreads.map((spread) => (
                <button
                  key={spread.id}
                  onClick={() => {
                    // TODO: set selected spread ID in store
                    setScreen('spread');
                  }}
                  className="p-3 rounded-xl bg-mystic-card border border-mystic-accent/20 text-left hover:border-mystic-accent/50 transition-colors relative"
                >
                  {spread.isNew && (
                    <span className="absolute -top-1 -right-1 bg-mystic-gold text-mystic-bg text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                  <span className="text-xl">{spread.icon}</span>
                  <p className="text-sm font-semibold mt-1 text-mystic-text">
                    {spread.name[l].replace(/^\S+\s/, '')}
                  </p>
                  <p className="text-[10px] text-mystic-muted mt-0.5">
                    {spread.freePerDay === -1 || spread.freePerDay > 0
                      ? l === 'uk' ? 'Безкоштовно' : 'Бесплатно'
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
