'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { MAJOR_ARCANA, ALL_CARDS, type TarotCard } from '@/data/tarot-cards';
import { motion, AnimatePresence } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Коллекция', uk: 'Колекція', en: 'Collection' },
  collected: { ru: 'карт собрано', uk: 'карт зібрано', en: 'cards collected' },
  major: { ru: 'Старшие Арканы', uk: 'Старші Аркани', en: 'Major Arcana' },
  minor: { ru: 'Младшие Арканы', uk: 'Молодші Аркани', en: 'Minor Arcana' },
  hint: { ru: '💡 Делай расклады чтобы собирать карты!', uk: '💡 Роби розклади щоб збирати карти!', en: '💡 Do readings to collect cards!' },
  upright: { ru: 'Прямое значение', uk: 'Пряме значення', en: 'Upright meaning' },
  reversed: { ru: 'Перевёрнутое значение', uk: 'Перевернуте значення', en: 'Reversed meaning' },
  tapToClose: { ru: 'нажми чтобы закрыть', uk: 'натисни щоб закрити', en: 'tap to close' },
  locked: { ru: 'Сделай расклад, чтобы открыть эту карту', uk: 'Зроби розклад, щоб відкрити цю карту', en: 'Do a reading to unlock this card' },
  suits: {
    wands: { ru: 'Жезлы', uk: 'Жезли', en: 'Wands' },
    cups: { ru: 'Кубки', uk: 'Кубки', en: 'Cups' },
    swords: { ru: 'Мечи', uk: 'Мечі', en: 'Swords' },
    pentacles: { ru: 'Пентакли', uk: 'Пентаклі', en: 'Pentacles' },
  },
};

const SUIT_ICONS: Record<string, string> = {
  major: '✦', wands: '🪄', cups: '🏆', swords: '⚔️', pentacles: '⭐',
};

const CARD_COLORS: Record<string, string> = {
  major: 'from-mystic-purple/60 to-mystic-blue/60',
  wands: 'from-red-900/50 to-orange-900/50',
  cups: 'from-blue-900/50 to-cyan-900/50',
  swords: 'from-slate-700/50 to-zinc-800/50',
  pentacles: 'from-yellow-900/50 to-green-900/50',
};

function getSuit(id: number): string {
  if (id <= 21) return 'major';
  if (id <= 35) return 'wands';
  if (id <= 49) return 'cups';
  if (id <= 63) return 'swords';
  return 'pentacles';
}

function getMinorCards(suitKey: string): TarotCard[] {
  return ALL_CARDS.filter(c => c.arcana === 'minor' && c.suit === suitKey);
}


// ─── Progress Summary ──────────────────────────────────────────────────────

function SuitProgress({ suitKey, suitName, icon, collected, total, color }: {
  suitKey: string; suitName: string; icon: string; collected: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  const isComplete = collected === total;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-mystic-text/80">
          {icon} {suitName}
        </span>
        <span className={`text-[10px] font-bold ${isComplete ? 'text-green-400' : 'text-mystic-muted'}`}>
          {collected}/{total} {isComplete ? '✅' : ''}
        </span>
      </div>
      <div className="h-1.5 bg-mystic-bg/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Card Detail Modal ─────────────────────────────────────────────────────

function CardModal({
  card,
  isUnlocked,
  l,
  onClose,
}: {
  card: TarotCard;
  isUnlocked: boolean;
  l: L;
  onClose: () => void;
}) {
  const suit = getSuit(card.id);
  const gradient = CARD_COLORS[suit];
  const symbol = SUIT_ICONS[suit];
  const hasImage = card.image && !card.image.includes('undefined');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 right-4 text-mystic-muted text-sm"
      >
        ✕
      </motion.div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="flex flex-col items-center max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {isUnlocked ? (
          <>
            {hasImage ? (
              <div className="max-w-[240px] max-h-[360px]">
                <img
                  src={card.image}
                  alt={card.name[l]}
                  className="w-full h-full object-contain rounded-2xl drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                />
              </div>
            ) : (
              <div className={`w-[180px] h-[270px] rounded-2xl border-2 border-mystic-accent/50 bg-gradient-to-b ${gradient} flex items-center justify-center`}>
                <span className="text-6xl">{symbol}</span>
              </div>
            )}

            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-mystic-accent font-mystic">
                {card.name[l]}
              </h3>

              {/* Upright keywords */}
              <div className="mt-3">
                <p className="text-[10px] text-mystic-muted uppercase tracking-wider mb-1">{T.upright[l]}</p>
                <p className="text-sm text-mystic-text/80">
                  {card.keywords[l].join(' • ')}
                </p>
              </div>

              {/* Reversed keywords */}
              <div className="mt-3">
                <p className="text-[10px] text-mystic-muted uppercase tracking-wider mb-1">{T.reversed[l]}</p>
                <p className="text-sm text-mystic-text/60">
                  {card.reversedKeywords[l].join(' • ')}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-[180px] h-[270px] rounded-2xl overflow-hidden">
              <img src="/ui/card-back.png" alt="" className="w-full h-full object-cover rounded-2xl opacity-60" />
            </div>
            <p className="text-sm text-mystic-muted mt-4 text-center">{T.locked[l]}</p>
          </>
        )}

        <p className="text-xs text-mystic-muted/50 mt-6 animate-pulse">
          {T.tapToClose[l]}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Main CollectionScreen ─────────────────────────────────────────────────

export default function CollectionScreen() {
  const { user, locale } = useAppStore();
  const l = (locale || 'ru') as L;
  const collected = new Set(user?.cardCollection || []);
  const totalCards = ALL_CARDS.length;
  const collectedCount = collected.size;

  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-1">🃏 {T.title[l]}</h1>
      <p className="text-xs text-mystic-muted mb-4">{collectedCount}/{totalCards} {T.collected[l]}</p>

      <div className="w-full h-2 bg-mystic-card rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-mystic-purple to-mystic-accent rounded-full transition-all"
          style={{ width: `${(collectedCount / totalCards) * 100}%` }} />
      </div>

      {/* Major Arcana */}
      <h2 className="text-sm font-bold text-mystic-text mb-3">
        ✦ {T.major[l]} ({MAJOR_ARCANA.filter(c => collected.has(c.id)).length}/22)
      </h2>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {MAJOR_ARCANA.map((card) => {
          const isUnlocked = collected.has(card.id);
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: card.id * 0.02 }}
              onClick={() => setSelectedCard(card)}
              className={`aspect-[2/3] rounded-lg transition-all relative overflow-hidden cursor-pointer active:scale-95 ${
                isUnlocked
                  ? 'glow'
                  : 'border border-mystic-accent/10 bg-mystic-card/40 opacity-40'
              }`}
            >
              {isUnlocked && card.image ? (
                <img src={card.image} alt={card.name[l]} className="absolute inset-0 w-full h-full object-cover animate-breathe" loading="lazy" />
              ) : (
                <img src="/ui/card-back.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" loading="lazy" />
              )}
              {!isUnlocked && (
                <span className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="text-[8px] text-center leading-tight text-mystic-muted">???</p>
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Minor Arcana */}
      <h2 className="text-sm font-bold text-mystic-text mb-3">✦ {T.minor[l]}</h2>
      {([
        { key: 'wands' as const, icon: '🪄' },
        { key: 'cups' as const, icon: '🏆' },
        { key: 'swords' as const, icon: '⚔️' },
        { key: 'pentacles' as const, icon: '⭐' },
      ]).map(({ key, icon }) => {
        const suitCards = getMinorCards(key);
        const suitCollected = suitCards.filter(c => collected.has(c.id)).length;
        return (
          <div key={key} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-bold text-mystic-text">{T.suits[key][l]}</span>
              <span className="text-[10px] text-mystic-muted ml-auto">{suitCollected}/{suitCards.length}</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {suitCards.map((card) => {
                const isUnlocked = collected.has(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`aspect-[2/3] rounded-md relative overflow-hidden cursor-pointer active:scale-90 transition-transform ${
                      isUnlocked
                        ? `glow-${key}`
                        : 'border border-mystic-accent/10 bg-mystic-card/30 opacity-30'
                    }`}
                  >
                    {isUnlocked && card.image ? (
                      <img src={card.image} alt={card.name[l]} className="absolute inset-0 w-full h-full object-cover animate-breathe" loading="lazy" />
                    ) : (
                      <img src="/ui/card-back.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" loading="lazy" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Progress bars */}
      <div className="bg-mystic-card/60 rounded-xl p-3 mb-4 mt-4 border border-mystic-accent/10 aura-mystic">
        <SuitProgress suitKey="major" suitName={l === 'ru' ? 'Старшие Арканы' : l === 'uk' ? 'Старші Аркани' : 'Major Arcana'} icon="✦" collected={MAJOR_ARCANA.filter(c => collected.has(c.id)).length} total={MAJOR_ARCANA.length} color="bg-gradient-to-r from-mystic-purple to-mystic-accent" />
        <SuitProgress suitKey="wands" suitName={T.suits.wands[l]} icon="🪄" collected={getMinorCards('wands').filter(c => collected.has(c.id)).length} total={14} color="bg-gradient-to-r from-red-600 to-orange-500" />
        <SuitProgress suitKey="cups" suitName={T.suits.cups[l]} icon="🏆" collected={getMinorCards('cups').filter(c => collected.has(c.id)).length} total={14} color="bg-gradient-to-r from-blue-600 to-cyan-500" />
        <SuitProgress suitKey="swords" suitName={T.suits.swords[l]} icon="⚔️" collected={getMinorCards('swords').filter(c => collected.has(c.id)).length} total={14} color="bg-gradient-to-r from-slate-500 to-zinc-400" />
        <SuitProgress suitKey="pentacles" suitName={T.suits.pentacles[l]} icon="⭐" collected={getMinorCards('pentacles').filter(c => collected.has(c.id)).length} total={14} color="bg-gradient-to-r from-yellow-600 to-green-500" />
      </div>

      <p className="text-center text-[11px] text-mystic-muted mt-6">{T.hint[l]}</p>

      {/* Card detail modal */}
      <AnimatePresence>
        {selectedCard && (
          <CardModal
            card={selectedCard}
            isUnlocked={collected.has(selectedCard.id)}
            l={l}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
