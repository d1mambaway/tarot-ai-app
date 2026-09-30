'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';
import { assetUrl } from '@/lib/assets';

type L = 'ru' | 'uk' | 'en';

const T = {
  cardOfDay: { ru: 'Карта дня', uk: 'Карта дня', en: 'Card of the Day' },
  cardOfDaySub: {
    ru: 'Бесплатно · послание на сегодня',
    uk: 'Безкоштовно · послання на сьогодні',
    en: 'Free · your message for today',
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
  const { locale, setScreen, setCurrentReading, addToHistory, user, patchUser } = useAppStore();
  const unlockCards = (ids: number[]) => {
    if (!user) return;
    const set = new Set([...user.cardCollection, ...ids]);
    patchUser({ cardCollection: Array.from(set) });
  };
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
        if (Array.isArray(data.newCardsUnlocked)) unlockCards(data.newCardsUnlocked);
        setScreen('reading');
        hapticSuccess();
      }
    } catch (err) {
      console.error('Card of day error:', err);
    } finally {
      setCotdLoading(false);
    }
  };

  const cardImage = cotdDrawn && cotdReading?.cards?.[0]?.image ? assetUrl(cotdReading.cards[0].image) : null;
  // Stored cards carry the name either as a string or as { ru, uk, en }
  const rawName = cotdDrawn ? cotdReading?.cards?.[0]?.name : undefined;
  const cardName: string | undefined = typeof rawName === 'string' ? rawName : rawName?.[l];

  // One horizontal card (the banner used to repeat the same card-back image twice)
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      onClick={handleCardOfDay}
      disabled={cotdLoading}
      className="relative w-full mb-3 rounded-[20px] overflow-hidden bg-mystic-card border border-mystic-gold/25 text-left shadow-[0_0_28px_rgba(212,175,55,0.10)]"
    >
      <div aria-hidden className="absolute inset-0 opacity-40 bg-[url('/ui/card-of-day-header.webp')] bg-[length:260%_auto] bg-right" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-mystic-card/95 via-mystic-card/80 to-mystic-card/40" />
      <div className="relative px-3 py-2.5 flex items-center gap-3">
        <div className="relative flex-shrink-0 animate-float w-[58px] h-[88px]">
          {cardImage ? (
            <Image src={cardImage} alt={cardName || 'Card of Day'} fill className="object-contain rounded-[4px]" unoptimized />
          ) : (
            <Image src="/ui/card-of-day.webp" alt="Card of Day" fill className="object-contain" unoptimized />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="t-card">{T.cardOfDay[l]}</p>
          {cotdDrawn ? (
            <>
              {cardName && <p className="text-base text-mystic-text/90 mt-0.5 truncate">{cardName}</p>}
              <p className="text-sm text-mystic-muted mt-0.5">
                ✅ {T.cardOfDayDone[l]}
                {timeLeft && <> · ⏰ {timeLeft}</>}
              </p>
            </>
          ) : (
            <p className="text-sm text-mystic-muted mt-0.5 leading-snug">{T.cardOfDaySub[l]}</p>
          )}
        </div>
        <div className="relative text-mystic-accent text-xl pr-1">
          {cotdLoading ? (
            <span className="animate-spin inline-block">🔮</span>
          ) : (
            <>
              →
              {!cotdDrawn && (
                <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
}
