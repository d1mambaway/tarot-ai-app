'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { getSpreadById } from '@/data/spreads';
import { motion } from 'framer-motion';
import ManaBalance from '@/components/ui/ManaBalance';
import ManaIcon from '@/components/ui/ManaIcon';

type L = 'ru' | 'uk' | 'en';

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
  cardOfDayDone: { ru: 'Уже получена сегодня', uk: 'Вже отримана сьогодні', en: 'Already drawn today' },
  nextCard: { ru: 'Новая карта через', uk: 'Нова карта через', en: 'Next card in' },
  viewCard: { ru: 'Посмотреть карту', uk: 'Переглянути карту', en: 'View card' },
  free: { ru: '✦ Бесплатно', uk: '✦ Безкоштовно', en: '✦ Free' },
};

/** Format time remaining as HH:MM:SS */
function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { user, locale, selectSpread, setScreen, setCurrentReading, addToHistory } = useAppStore();
  const l = (locale || 'ru') as L;
  const cardOfDay = getSpreadById('card_of_day')!;

  const [cotdDrawn, setCotdDrawn] = useState(false);
  const [cotdReading, setCotdReading] = useState<any>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [cotdLoading, setCotdLoading] = useState(false);

  // Check if card of day already drawn
  useEffect(() => {
    const checkCotd = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg?.initData) return;

      try {
        const res = await fetch(`/api/card-of-day?initData=${encodeURIComponent(tg.initData)}`);
        const data = await res.json();
        if (data.exists) {
          setCotdDrawn(true);
          setCotdReading(data.reading);
        }
        if (data.nextReset) setNextReset(data.nextReset);
      } catch {
        // Ignore
      }
    };
    checkCotd();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!nextReset) return;
    const timer = setInterval(() => {
      const ms = new Date(nextReset).getTime() - Date.now();
      if (ms <= 0) {
        setCotdDrawn(false);
        setCotdReading(null);
        setTimeLeft('');
        clearInterval(timer);
      } else {
        setTimeLeft(formatTimeLeft(ms));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextReset]);

  const handleCardOfDay = async () => {
    if (cotdDrawn && cotdReading) {
      // Show existing reading
      setCurrentReading(cotdReading);
      setScreen('reading');
      return;
    }

    // Draw new card
    setCotdLoading(true);
    const tg = (window as any).Telegram?.WebApp;
    try {
      const res = await fetch('/api/card-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg?.initData || '' }),
      });
      const data = await res.json();
      if (data.interpretation) {
        const reading = {
          id: data.id,
          spreadId: 'card_of_day',
          cards: data.cards || [],
          interpretation: data.interpretation,
          createdAt: data.createdAt,
        };
        setCotdDrawn(true);
        setCotdReading(reading);
        if (data.nextReset) setNextReset(data.nextReset);
        setCurrentReading(reading);
        addToHistory(reading);
        setScreen('reading');
      }
    } catch (err) {
      console.error('Card of day error:', err);
    } finally {
      setCotdLoading(false);
    }
  };

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
        onClick={handleCardOfDay}
        disabled={cotdLoading}
        className="w-full mb-6 p-5 rounded-2xl bg-gradient-to-br from-mystic-purple/30 via-mystic-card to-mystic-blue/30 border border-mystic-accent/40 glow-strong text-left"
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-float">🌅</div>
          <div className="flex-1">
            <p className="font-bold text-lg text-mystic-accent font-mystic">{T.cardOfDay[l]}</p>
            {cotdDrawn ? (
              <div>
                <p className="text-xs text-green-400 mt-0.5">✅ {T.cardOfDayDone[l]}</p>
                {timeLeft && (
                  <p className="text-[10px] text-mystic-muted mt-0.5">
                    ⏰ {T.nextCard[l]} {timeLeft}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-mystic-muted mt-0.5">{T.cardOfDaySub[l]}</p>
            )}
          </div>
          <div className="relative text-mystic-accent text-2xl">
            {cotdLoading ? (
              <span className="animate-spin">🔮</span>
            ) : (
              <>
                →
                {!cotdDrawn && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                )}
              </>
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
