'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import TarotCard from '@/components/cards/TarotCard';

export default function ReadingScreen() {
  const { currentReading, selectedSpread, locale, setScreen } = useAppStore();
  const l = locale || 'ru';
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);

  const cards = currentReading?.cards || [];
  const hasCards = cards.length > 0;

  // Auto-reveal cards one by one
  useEffect(() => {
    if (!hasCards) {
      // No cards (mystic readings) — show interpretation immediately
      setShowInterpretation(true);
      return;
    }

    cards.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCards((prev) => {
          const next = new Set(prev);
          next.add(i);
          if (next.size === cards.length) {
            setTimeout(() => {
              setAllRevealed(true);
              setTimeout(() => setShowInterpretation(true), 600);
            }, 500);
          }
          return next;
        });
      }, 800 + i * 600);
    });
  }, [cards, hasCards]);

  if (!currentReading) {
    return (
      <div className="px-4 pt-4 relative z-10">
        <button onClick={() => setScreen('home')} className="text-mystic-accent mb-4 text-sm">← {l === 'uk' ? 'Головна' : 'Главная'}</button>
        <p className="text-mystic-muted">{l === 'uk' ? 'Немає результату' : 'Нет результата'}</p>
      </div>
    );
  }

  const interpretation = currentReading.interpretation || '';
  // Split interpretation into paragraphs
  const paragraphs = interpretation.split('\n').filter((p) => p.trim().length > 0);

  return (
    <div className="px-4 pt-4 pb-8 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setScreen('home')} className="text-mystic-accent text-sm">
          ← {l === 'uk' ? 'Головна' : 'Главная'}
        </button>
        {selectedSpread && (
          <span className="text-sm text-mystic-muted">
            {selectedSpread.icon} {selectedSpread.name[l].replace(/^[\S]+\s/, '')}
          </span>
        )}
      </div>

      {/* Cards */}
      {hasCards && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          {/* Cards grid */}
          <div className={`flex flex-wrap justify-center gap-3 mb-4 ${cards.length > 5 ? 'gap-2' : 'gap-3'}`}>
            {cards.map((card, i) => (
              <div
                key={i}
                className="animate-card-deal"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <TarotCard
                  id={card.id}
                  name={card.name}
                  image={card.image}
                  reversed={card.reversed}
                  revealed={revealedCards.has(i)}
                  delay={0}
                  position={selectedSpread?.positions?.[i]?.[l]}
                  keywords={card.keywords}
                  size={cards.length > 5 ? 'small' : 'normal'}
                />
              </div>
            ))}
          </div>

          {/* "Tap to reveal" hint */}
          {!allRevealed && (
            <p className="text-center text-mystic-muted text-xs animate-pulse">
              {l === 'uk' ? 'Карти відкриваються...' : 'Карты открываются...'}
            </p>
          )}
        </motion.div>
      )}

      {/* Interpretation */}
      {showInterpretation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-mystic-card/80 rounded-2xl p-5 border border-mystic-accent/20 glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔮</span>
            <h2 className="font-bold text-mystic-accent font-mystic">
              {l === 'uk' ? 'Інтерпретація' : 'Интерпретация'}
            </h2>
          </div>

          <div className="reading-text space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-mystic-text/90 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setScreen('home')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg font-bold text-sm"
            >
              🏠 {l === 'uk' ? 'Головна' : 'Главная'}
            </button>
            <button
              onClick={() => {
                // Re-do same spread
                setScreen('spread');
              }}
              className="flex-1 py-3 rounded-xl bg-mystic-card border border-mystic-accent/30 text-mystic-accent font-bold text-sm"
            >
              🔄 {l === 'uk' ? 'Ще раз' : 'Ещё раз'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading state while waiting for interpretation */}
      {!showInterpretation && !hasCards && (
        <div className="text-center py-12">
          <div className="text-5xl animate-float mb-4">🔮</div>
          <p className="text-mystic-muted animate-pulse">
            {l === 'uk' ? 'Зірки говорять...' : 'Звёзды говорят...'}
          </p>
        </div>
      )}
    </div>
  );
}
