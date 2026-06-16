'use client';

import { useAppStore } from '@/store/app-store';
import { MAJOR_ARCANA, ALL_CARDS } from '@/data/tarot-cards';
import { motion } from 'framer-motion';

export default function CollectionScreen() {
  const { user, locale } = useAppStore();
  const l = locale || 'ru';
  const collected = new Set(user?.cardCollection || []);

  const majorCards = MAJOR_ARCANA;
  const totalCards = ALL_CARDS.length;
  const collectedCount = collected.size;

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-1">
        🃏 {l === 'uk' ? 'Колекція' : 'Коллекция'}
      </h1>
      <p className="text-xs text-mystic-muted mb-4">
        {collectedCount}/{totalCards} {l === 'uk' ? 'карт зібрано' : 'карт собрано'}
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-mystic-card rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-mystic-purple to-mystic-accent rounded-full transition-all"
          style={{ width: `${(collectedCount / totalCards) * 100}%` }}
        />
      </div>

      {/* Major Arcana */}
      <h2 className="text-sm font-bold text-mystic-text mb-3">
        ✦ {l === 'uk' ? 'Старші Аркани' : 'Старшие Арканы'} ({majorCards.filter(c => collected.has(c.id)).length}/22)
      </h2>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {majorCards.map((card) => {
          const isUnlocked = collected.has(card.id);
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: card.id * 0.02 }}
              className={`aspect-[2/3] rounded-lg flex flex-col items-center justify-center p-1 border transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-br from-mystic-purple/40 to-mystic-blue/40 border-mystic-accent/40 glow'
                  : 'bg-mystic-card/40 border-mystic-accent/10 opacity-40'
              }`}
            >
              <span className="text-lg mb-0.5">{isUnlocked ? '✦' : '?'}</span>
              <p className={`text-[8px] text-center leading-tight ${isUnlocked ? 'text-mystic-accent' : 'text-mystic-muted'}`}>
                {isUnlocked ? card.name[l] : '???'}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Minor Arcana summary */}
      <h2 className="text-sm font-bold text-mystic-text mb-3">
        ✦ {l === 'uk' ? 'Молодші Аркани' : 'Младшие Арканы'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { suit: l === 'uk' ? 'Жезли' : 'Жезлы', icon: '🪄', range: [22, 35] },
          { suit: l === 'uk' ? 'Кубки' : 'Кубки', icon: '🏆', range: [36, 49] },
          { suit: l === 'uk' ? 'Мечі' : 'Мечи', icon: '⚔️', range: [50, 63] },
          { suit: l === 'uk' ? "Пентаклі" : 'Пентакли', icon: '⭐', range: [64, 77] },
        ].map(({ suit, icon, range }) => {
          const suitCards = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i);
          const suitCollected = suitCards.filter(id => collected.has(id)).length;
          return (
            <div key={suit} className="bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-bold text-mystic-text">{suit}</span>
              </div>
              <div className="w-full h-1.5 bg-mystic-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-mystic-accent/60 rounded-full"
                  style={{ width: `${(suitCollected / 14) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-mystic-muted mt-1">{suitCollected}/14</p>
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-[11px] text-mystic-muted mt-6">
        {l === 'uk'
          ? '💡 Роби розклади щоб збирати карти!'
          : '💡 Делай расклады чтобы собирать карты!'}
      </p>
    </div>
  );
}
