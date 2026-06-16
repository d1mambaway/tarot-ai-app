'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { getSpreadById } from '@/data/spreads';
import { motion } from 'framer-motion';
import ManaBalance from '@/components/ui/ManaBalance';
import ManaIcon from '@/components/ui/ManaIcon';

type L = 'ru' | 'uk' | 'en';

/** UTC date string like "2026-06-16" */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCardOfDayDrawn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('mk_cotd_date') === todayUTC();
}

export function markCardOfDayDrawn() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mk_cotd_date', todayUTC());
  }
}

const CATEGORIES: { id: SpreadCategory; label: Record<L, string> }[] = [
  { id: 'tarot', label: { ru: '🃏 Таро и расклады', uk: '🃏 Таро і розклади', en: '🃏 Tarot Spreads' } },
  { id: 'mystic', label: { ru: '🔮 Мистика', uk: '🔮 Містика', en: '🔮 Mystic' } },
  { id: 'photo', label: { ru: '📸 По фото', uk: '📸 За фото', en: '📸 Photo-based' } },
  { id: 'personal', label: { ru: '🧠 Личное', uk: '🧠 Особисте', en: '🧠 Personal' } },
];

const T = {
  greeting: { ru: 'Привет', uk: 'Вітаю', en: 'Hello' },
  days: { ru: 'дней', uk: 'днів', en: 'days' },
  cardOfDay: { ru: 'Карта дня', uk: 'Карта дня', en: 'Card of the Day' },
  cardOfDaySub: { ru: 'Бесплатно • Ежедневное послание от карт', uk: 'Безкоштовно • Щоденне послання від карт', en: 'Free • Your daily message from the cards' },
  free: { ru: '✦ Бесплатно', uk: '✦ Безкоштовно', en: '✦ Free' },
};

export default function HomeScreen() {
  const { user, locale, selectSpread, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const cardOfDay = getSpreadById('card_of_day')!;
  const [cotdAvailable, setCotdAvailable] = useState(true);

  useEffect(() => {
    setCotdAvailable(!isCardOfDayDrawn());
  }, []);

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-mystic text-gradient-gold">✨ Магия Карт</h1>
          <ManaBalance onClick={() => setScreen('shop')} />
        </div>
        {user && (
          <p className="text-sm text-mystic-muted mt-1">
            {T.greeting[l]}, {user.firstName}
            {user.streakDays > 0 && (
              <span className="ml-2 text-mystic-accent">🔥 {user.streakDays} {T.days[l]}</span>
            )}
          </p>
        )}
      </motion.div>

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
            <p className="font-bold text-lg text-mystic-accent font-mystic">{T.cardOfDay[l]}</p>
            <p className="text-xs text-mystic-muted mt-0.5">{T.cardOfDaySub[l]}</p>
          </div>
          <div className="relative text-mystic-accent text-2xl">
            →
            {cotdAvailable && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </motion.button>

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
            <h2 className="text-base font-bold mb-3 text-mystic-text">{cat.label[l]}</h2>
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
                  <p className="text-[10px] text-mystic-muted mt-1 flex items-center gap-1">
                    {spread.manaCost === 0 ? (
                      <span>{T.free[l]}</span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <ManaIcon size="sm" /> {spread.manaCost}
                      </span>
                    )}
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
