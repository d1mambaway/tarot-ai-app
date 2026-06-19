'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const T = {
  cardOfDay: { ru: 'Карта дня', uk: 'Карта дня', en: 'Card of the Day' },
  cardOfDaySub: {
    ru: 'Бесплатно • Ежедневное послание от карт',
    uk: 'Безкоштовно • Щоденне послання від карт',
    en: 'Free • Your daily message from the cards',
  },
  cardOfDayDone: {
    ru: 'Уже получена сегодня',
    uk: 'Вже отримана сьогодні',
    en: 'Already drawn today',
  },
  nextCard: { ru: 'Новая карта через', uk: 'Нова карта через', en: 'Next card in' },
};

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CardOfDaySection() {
  const { locale, setScreen, setCurrentReading, addToHistory } = useAppStore();
  const l = (locale || 'ru') as L;

  const [cotdDrawn, setCotdDrawn] = useState(false);
  const [cotdReading, setCotdReading] = useState<any>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [cotdLoading, setCotdLoading] = useState(false);

  useEffect(() => {
    const checkCotd = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg?.initData) return;
      try {
        const res = await fetch(
          `/api/card-of-day?initData=${encodeURIComponent(tg.initData)}`
        );
        const data = await res.json();
        if (data.exists) {
          setCotdDrawn(true);
          setCotdReading(data.reading);
        }
        if (data.nextReset) setNextReset(data.nextReset);
      } catch {
        /* ignore */
      }
    };
    checkCotd();
  }, []);

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
      hapticMedium();
      setCurrentReading({ ...cotdReading, alreadyDrawn: true });
      setScreen('reading');
      return;
    }
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
        hapticSuccess();
      }
    } catch (err) {
      console.error('Card of day error:', err);
    } finally {
      setCotdLoading(false);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onClick={handleCardOfDay}
      disabled={cotdLoading}
      className="w-full mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-mystic-purple/30 via-mystic-card to-mystic-blue/30 border border-mystic-accent/40 glow-strong text-left"
    >
      {/* Banner header */}
      <img src="/ui/card-of-day-header.webp" alt="" className="w-full h-auto block" />

      {/* Bouncing card + info */}
      <div className="p-3 flex items-center gap-3">
        <div className={`relative flex-shrink-0 animate-float ${cotdDrawn && cotdReading?.cards?.[0]?.image ? 'w-[85px] h-[128px]' : 'w-[120px] h-[120px]'}`}>
          {cotdDrawn && cotdReading?.cards?.[0]?.image ? (
            <Image
              src={cotdReading.cards[0].image}
              alt="Card of Day"
              fill
              className="object-cover rounded-lg"
              unoptimized
            />
          ) : (
            <Image
              src="/ui/card-of-day.png"
              alt="Card of Day"
              fill
              className="object-contain"
              unoptimized
            />
          )}
        </div>
        <div className="flex-1">

          <p className="font-bold text-lg text-mystic-accent font-mystic">
            {T.cardOfDay[l]}
          </p>
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
  );
}
