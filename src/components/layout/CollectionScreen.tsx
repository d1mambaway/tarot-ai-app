'use client';

import { useAppStore } from '@/store/app-store';
import { MAJOR_ARCANA, ALL_CARDS } from '@/data/tarot-cards';
import { motion } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Коллекция', uk: 'Колекція', en: 'Collection' },
  collected: { ru: 'карт собрано', uk: 'карт зібрано', en: 'cards collected' },
  major: { ru: 'Старшие Арканы', uk: 'Старші Аркани', en: 'Major Arcana' },
  minor: { ru: 'Младшие Арканы', uk: 'Молодші Аркани', en: 'Minor Arcana' },
  hint: { ru: '💡 Делай расклады чтобы собирать карты!', uk: '💡 Роби розклади щоб збирати карти!', en: '💡 Do readings to collect cards!' },
  suits: {
    wands: { ru: 'Жезлы', uk: 'Жезли', en: 'Wands' },
    cups: { ru: 'Кубки', uk: 'Кубки', en: 'Cups' },
    swords: { ru: 'Мечи', uk: 'Мечі', en: 'Swords' },
    pentacles: { ru: 'Пентакли', uk: 'Пентаклі', en: 'Pentacles' },
  },
};

export default function CollectionScreen() {
  const { user, locale } = useAppStore();
  const l = (locale || 'ru') as L;
  const collected = new Set(user?.cardCollection || []);
  const totalCards = ALL_CARDS.length;
  const collectedCount = collected.size;

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-1">🃏 {T.title[l]}</h1>
      <p className="text-xs text-mystic-muted mb-4">{collectedCount}/{totalCards} {T.collected[l]}</p>

      <div className="w-full h-2 bg-mystic-card rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-mystic-purple to-mystic-accent rounded-full transition-all"
          style={{ width: `${(collectedCount / totalCards) * 100}%` }} />
      </div>

      <h2 className="text-sm font-bold text-mystic-text mb-3">
        ✦ {T.major[l]} ({MAJOR_ARCANA.filter(c => collected.has(c.id)).length}/22)
      </h2>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {MAJOR_ARCANA.map((card) => {
          const isUnlocked = collected.has(card.id);
          return (
            <motion.div key={card.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: card.id * 0.02 }}
              className={`aspect-[2/3] rounded-lg flex flex-col items-center justify-center p-1 border transition-all relative overflow-hidden ${
                isUnlocked ? 'bg-gradient-to-br from-mystic-purple/40 to-mystic-blue/40 border-mystic-accent/40 glow' : 'bg-mystic-card/40 border-mystic-accent/10 opacity-40'
              }`}>
              {isUnlocked && card.image ? (
                <img src={card.image} alt={card.name[l]} className="w-full h-full object-cover rounded-lg absolute inset-0" loading="lazy" />
              ) : (
                <span className="text-lg mb-0.5">{isUnlocked ? '✦' : '?'}</span>
              )}
              <p className={`text-[8px] text-center leading-tight z-10 ${isUnlocked ? 'text-mystic-accent drop-shadow-lg' : 'text-mystic-muted'}`}>
                {isUnlocked ? card.name[l] : '???'}
              </p>
            </motion.div>
          );
        })}
      </div>

      <h2 className="text-sm font-bold text-mystic-text mb-3">✦ {T.minor[l]}</h2>
      <div className="grid grid-cols-2 gap-3">
        {([
          { key: 'wands' as const, icon: '🪄', range: [22, 35] },
          { key: 'cups' as const, icon: '🏆', range: [36, 49] },
          { key: 'swords' as const, icon: '⚔️', range: [50, 63] },
          { key: 'pentacles' as const, icon: '⭐', range: [64, 77] },
        ]).map(({ key, icon, range }) => {
          const suitCards = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i);
          const suitCollected = suitCards.filter(id => collected.has(id)).length;
          return (
            <div key={key} className="bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-bold text-mystic-text">{T.suits[key][l]}</span>
              </div>
              <div className="w-full h-1.5 bg-mystic-bg rounded-full overflow-hidden">
                <div className="h-full bg-mystic-accent/60 rounded-full" style={{ width: `${(suitCollected / 14) * 100}%` }} />
              </div>
              <p className="text-[10px] text-mystic-muted mt-1">{suitCollected}/14</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-mystic-muted mt-6">{T.hint[l]}</p>
    </div>
  );
}
