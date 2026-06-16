'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import TarotCard from '@/components/cards/TarotCard';

type L = 'ru' | 'uk' | 'en';

const T = {
  home: { ru: 'Главная', uk: 'Головна', en: 'Home' },
  noResult: { ru: 'Нет результата', uk: 'Немає результату', en: 'No result' },
  revealing: { ru: 'Карты открываются...', uk: 'Карти відкриваються...', en: 'Revealing cards...' },
  interpretation: { ru: 'Толкование', uk: 'Тлумачення', en: 'Interpretation' },
  again: { ru: 'Ещё раз', uk: 'Ще раз', en: 'Again' },
  loading: { ru: 'Звёзды говорят...', uk: 'Зірки говорять...', en: 'The stars are speaking...' },
};

export default function ReadingScreen() {
  const { currentReading, selectedSpread, locale, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);

  const cards = currentReading?.cards || [];
  const hasCards = cards.length > 0;

  useEffect(() => {
    if (!hasCards) {
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
        <button onClick={() => setScreen('home')} className="text-mystic-accent mb-4 text-sm">← {T.home[l]}</button>
        <p className="text-mystic-muted">{T.noResult[l]}</p>
      </div>
    );
  }

  const paragraphs = (currentReading.interpretation || '').split('\n').filter((p) => p.trim().length > 0);

  return (
    <div className="px-4 pt-4 pb-8 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setScreen('home')} className="text-mystic-accent text-sm">← {T.home[l]}</button>
        {selectedSpread && (
          <span className="text-sm text-mystic-muted">
            {selectedSpread.icon} {selectedSpread.name[l]?.replace(/^[\S]+\s/, '')}
          </span>
        )}
      </div>

      {hasCards && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className={`flex flex-wrap justify-center gap-3 mb-4 ${cards.length > 5 ? 'gap-2' : 'gap-3'}`}>
            {cards.map((card, i) => (
              <div key={i} className="animate-card-deal"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0, animationFillMode: 'forwards' }}>
                <TarotCard id={card.id} name={card.name} image={card.image} reversed={card.reversed}
                  revealed={revealedCards.has(i)} delay={0}
                  position={selectedSpread?.positions?.[i]?.[l]} keywords={card.keywords}
                  size={cards.length > 5 ? 'small' : 'normal'} />
              </div>
            ))}
          </div>
          {!allRevealed && <p className="text-center text-mystic-muted text-xs animate-pulse">{T.revealing[l]}</p>}
        </motion.div>
      )}

      {showInterpretation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="bg-mystic-card/80 rounded-2xl p-5 border border-mystic-accent/20 glow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔮</span>
            <h2 className="font-bold text-mystic-accent font-mystic">{T.interpretation[l]}</h2>
          </div>
          <div className="reading-text space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-mystic-text/90 leading-relaxed">{p}</p>
            ))}
          </div>
          <div className="mt-6">
            <button onClick={() => setScreen('home')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg font-bold text-sm">
              🏠 {T.home[l]}
            </button>
          </div>
        </motion.div>
      )}

      {!showInterpretation && !hasCards && (
        <div className="text-center py-12">
          <div className="text-5xl animate-float mb-4">🔮</div>
          <p className="text-mystic-muted animate-pulse">{T.loading[l]}</p>
        </div>
      )}
    </div>
  );
}
