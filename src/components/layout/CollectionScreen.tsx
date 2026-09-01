'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { MAJOR_ARCANA, ALL_CARDS, type TarotCard } from '@/data/tarot-cards';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { assetUrl } from '@/lib/assets';

type L = 'ru' | 'uk' | 'en';
type SuitKey = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

const T = {
  title: { ru: 'Гримуар', uk: 'Гримуар', en: 'Grimoire' },
  collected: { ru: 'карт собрано', uk: 'карт зібрано', en: 'cards collected' },
  major: { ru: 'Старшие Арканы', uk: 'Старші Аркани', en: 'Major Arcana' },
  minor: { ru: 'Младшие Арканы', uk: 'Молодші Аркани', en: 'Minor Arcana' },
  hint: { ru: '💡 Делай расклады чтобы собирать карты!', uk: '💡 Роби розклади щоб збирати карти!', en: '💡 Do readings to collect cards!' },
  upright: { ru: 'Прямое значение', uk: 'Пряме значення', en: 'Upright meaning' },
  reversed: { ru: 'Перевёрнутое значение', uk: 'Перевернуте значення', en: 'Reversed meaning' },
  tapToClose: { ru: 'нажми чтобы закрыть', uk: 'натисни щоб закрити', en: 'tap to close' },
  locked: { ru: 'Сделай расклад, чтобы открыть эту карту', uk: 'Зроби розклад, щоб відкрити цю карту', en: 'Do a reading to unlock this card' },
  coverTitle: { ru: 'Гримуар карт', uk: 'Гримуар карт', en: 'Card Grimoire' },
  coverHint: { ru: 'свайпни, чтобы открыть →', uk: 'свайпни, щоб відкрити →', en: 'swipe to open →' },
  suits: {
    major: { ru: 'Старшие Арканы', uk: 'Старші Аркани', en: 'Major Arcana' },
    wands: { ru: 'Жезлы', uk: 'Жезли', en: 'Wands' },
    cups: { ru: 'Кубки', uk: 'Кубки', en: 'Cups' },
    swords: { ru: 'Мечи', uk: 'Мечі', en: 'Swords' },
    pentacles: { ru: 'Пентакли', uk: 'Пентаклі', en: 'Pentacles' },
  },
};

const SUIT_ICONS: Record<string, string> = {
  major: '✦', wands: '🪄', cups: '🏆', swords: '⚔️', pentacles: '⭐',
};

// Real ink-on-parchment glyphs for the minor suits — no equivalent asset for
// Major Arcana, so that page keeps its ✦ symbol.
const SUIT_ICON_IMG: Partial<Record<SuitKey, string>> = {
  wands: '/ui/suit-wand.webp',
  cups: '/ui/suit-cup.webp',
  swords: '/ui/suit-sword.webp',
  pentacles: '/ui/suit-pentacle.webp',
};

const CARD_COLORS: Record<string, string> = {
  major: 'from-mystic-purple/60 to-mystic-blue/60',
  wands: 'from-red-900/50 to-orange-900/50',
  cups: 'from-blue-900/50 to-cyan-900/50',
  swords: 'from-slate-700/50 to-zinc-800/50',
  pentacles: 'from-yellow-900/50 to-green-900/50',
};

const SUIT_GLOW: Record<SuitKey, string> = {
  major: 'glow', wands: 'glow-wands', cups: 'glow-cups', swords: 'glow-swords', pentacles: 'glow-pentacles',
};

const SUIT_BAR_COLOR: Record<SuitKey, string> = {
  major: 'bg-gradient-to-r from-mystic-purple to-mystic-accent',
  wands: 'bg-gradient-to-r from-red-600 to-orange-500',
  cups: 'bg-gradient-to-r from-blue-600 to-cyan-500',
  swords: 'bg-gradient-to-r from-slate-500 to-zinc-400',
  pentacles: 'bg-gradient-to-r from-yellow-600 to-green-500',
};

function getSuit(id: number): SuitKey {
  if (id <= 21) return 'major';
  if (id <= 35) return 'wands';
  if (id <= 49) return 'cups';
  if (id <= 63) return 'swords';
  return 'pentacles';
}

function getMinorCards(suitKey: string): TarotCard[] {
  return ALL_CARDS.filter(c => c.arcana === 'minor' && c.suit === suitKey);
}

// ─── Book pages ─────────────────────────────────────────────────────────────
// Page 0 is the cover; one page per suit after that. Reading through the
// book IS browsing the collection — there's no separate "progress panel"
// duplicating what each page already shows in its own header.

type BookPage =
  | { type: 'cover' }
  | { type: 'suit'; key: SuitKey; cards: TarotCard[] };

function buildPages(): BookPage[] {
  return [
    { type: 'cover' },
    { type: 'suit', key: 'major', cards: MAJOR_ARCANA },
    { type: 'suit', key: 'wands', cards: getMinorCards('wands') },
    { type: 'suit', key: 'cups', cards: getMinorCards('cups') },
    { type: 'suit', key: 'swords', cards: getMinorCards('swords') },
    { type: 'suit', key: 'pentacles', cards: getMinorCards('pentacles') },
  ];
}

// A real page turn, not a slide: the leaving page rotates hard on its spine
// edge (±82°, near edge-on) and stays visually solid until the very end —
// opacity only drops in the last quarter, once perspective has already
// foreshortened it to a sliver, echoing how an actual page disappears from
// view as it swings past 90°. The incoming page starts from a shallow tilt
// and settles in on a short delay, so it reads as *revealed* by the leaving
// page rather than sliding in alongside it.
// originX travels through the SAME custom-driven variant functions as
// rotateY (unlike a plain CSS transformOrigin in `style`, which would freeze
// at whatever it was when a page was last the active one, not when it starts
// exiting) — see AnimatePresence's `custom` prop below for why that matters.
const PAGE_VARIANTS = {
  enter: (dir: number) => ({ rotateY: dir >= 0 ? 12 : -12, opacity: 0, originX: dir >= 0 ? 1 : 0 }),
  center: {
    rotateY: 0,
    opacity: 1,
    originX: 0.5,
    transition: { delay: 0.14, duration: 0.46, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: (dir: number) => ({
    rotateY: dir >= 0 ? -82 : 82,
    opacity: [1, 1, 0],
    originX: dir >= 0 ? 0 : 1,
    transition: { duration: 0.5, times: [0, 0.72, 1], ease: [0.45, 0, 0.2, 1] as const },
  }),
};

const SWIPE_THRESHOLD = 70;

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
  const cardImage = assetUrl(card.image);
  const hasImage = cardImage && !cardImage.includes('undefined');

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
                  src={assetUrl(card.image)}
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
              <img src="/ui/card-back.webp" alt="" className="w-full h-full object-cover rounded-2xl opacity-60" />
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

// ─── Book pages content ─────────────────────────────────────────────────────

function CoverPage({ collectedCount, totalCards, l }: { collectedCount: number; totalCards: number; l: L }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-center p-6"
      style={{
        backgroundImage: `url('/ui/grimoire-cover.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-black/45 rounded-xl px-5 py-4 backdrop-blur-[1px]">
        <p className="text-2xl font-bold font-mystic text-white mb-1.5">{T.coverTitle[l]}</p>
        <p className="text-sm text-white/80 mb-3">{collectedCount} / {totalCards} {T.collected[l]}</p>
        <p className="text-xs text-mystic-gold/90 animate-pulse">{T.coverHint[l]}</p>
      </div>
    </div>
  );
}

function SuitPage({
  suitKey,
  cards,
  collected,
  l,
  onSelectCard,
}: {
  suitKey: SuitKey;
  cards: TarotCard[];
  collected: Set<number>;
  l: L;
  onSelectCard: (card: TarotCard) => void;
}) {
  const suitCollected = cards.filter(c => collected.has(c.id)).length;
  const pct = cards.length > 0 ? Math.round((suitCollected / cards.length) * 100) : 0;
  const iconSrc = SUIT_ICON_IMG[suitKey];

  return (
    <div
      className="absolute inset-0 overflow-y-auto p-4"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(20,16,30,0.68), rgba(20,16,30,0.8)), url('/ui/grimoire-parchment.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {iconSrc
          ? <img src={iconSrc} alt="" className="w-6 h-6 object-contain drop-shadow-[0_0_3px_rgba(212,175,55,0.6)]" />
          : <span className="text-lg">{SUIT_ICONS.major}</span>}
        <span className="text-base font-bold font-mystic text-mystic-text">{T.suits[suitKey][l]}</span>
        <span className="text-[11px] text-mystic-muted ml-auto">{suitCollected}/{cards.length}</span>
      </div>
      <div className="h-1.5 bg-mystic-bg/60 rounded-full overflow-hidden mb-4">
        <div className={`h-full rounded-full transition-all duration-700 ${SUIT_BAR_COLOR[suitKey]}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const isUnlocked = collected.has(card.id);
          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card)}
              className={`aspect-[2/3] rounded-lg relative overflow-hidden cursor-pointer active:scale-95 transition-transform ${
                isUnlocked ? SUIT_GLOW[suitKey] : 'border border-mystic-accent/10 bg-mystic-card/30 opacity-40'
              }`}
            >
              {isUnlocked && card.image ? (
                <img src={assetUrl(card.image)} alt={card.name[l]} className="absolute inset-0 w-full h-full object-cover animate-breathe" loading="lazy" />
              ) : (
                <img src="/ui/card-back.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" loading="lazy" />
              )}
              {!isUnlocked && (
                <span className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="text-[9px] text-center leading-tight text-mystic-muted">???</p>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main CollectionScreen ─────────────────────────────────────────────────

export default function CollectionScreen() {
  const { user, locale } = useAppStore();
  const l = (locale || 'ru') as L;
  const collected = new Set(user?.cardCollection || []);
  const totalCards = ALL_CARDS.length;
  const collectedCount = collected.size;

  const pages = buildPages();
  const [[pageIdx, direction], setPageState] = useState<[number, number]>([0, 0]);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= pages.length || idx === pageIdx) return;
    setPageState([idx, idx > pageIdx ? 1 : -1]);
  };

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(pageIdx + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(pageIdx - 1);
  };

  const page = pages[pageIdx];
  const ribbonPct = pages.length > 1 ? pageIdx / (pages.length - 1) : 0;

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold font-mystic text-gradient-gold">{T.title[l]}</h1>
        <p className="text-xs text-mystic-muted">{collectedCount}/{totalCards} {T.collected[l]}</p>
      </div>

      {/* ── The book itself ── */}
      <div className="relative" style={{ perspective: 1400 }}>
        {/* Ribbon bookmark — its position along the top tracks how far through
            the book you've paged, so it doubles as a progress indicator. */}
        <img
          src="/ui/grimoire-ribbon.webp"
          alt=""
          className="absolute -top-3 h-12 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] pointer-events-none z-20 transition-[left] duration-300 ease-out"
          style={{ left: `${6 + ribbonPct * 82}%` }}
        />

        <div
          className="relative rounded-2xl overflow-hidden border border-mystic-gold/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ height: 'min(560px, 66vh)' }}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={pageIdx}
              custom={direction}
              variants={PAGE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragElastic={0.15}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="absolute inset-0"
            >
              {page.type === 'cover' ? (
                <CoverPage collectedCount={collectedCount} totalCards={totalCards} l={l} />
              ) : (
                <SuitPage
                  suitKey={page.key}
                  cards={page.cards}
                  collected={collected}
                  l={l}
                  onSelectCard={setSelectedCard}
                />
              )}
              {/* Hinge shadow — inherits enter/center/exit from the parent
                  (no explicit initial/animate/exit of its own), so it only
                  appears while this page is turning away. */}
              <motion.div
                variants={{
                  enter: { opacity: 0 },
                  center: { opacity: 0 },
                  exit: (dir: number) => ({
                    opacity: 0.55,
                    transition: { duration: 0.42, delay: 0.04 },
                    background: dir >= 0
                      ? 'linear-gradient(to left, rgba(0,0,0,0.55), rgba(0,0,0,0) 35%)'
                      : 'linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0) 35%)',
                  }),
                }}
                className="absolute inset-0 pointer-events-none z-10"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav: buttons are the reliable way to turn pages; swipe above is a bonus */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => goTo(pageIdx - 1)}
            disabled={pageIdx === 0}
            className="w-8 h-8 rounded-full bg-mystic-card/70 border border-mystic-gold/25 text-mystic-text flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === pageIdx ? 'bg-mystic-gold shadow-[0_0_4px_rgba(212,175,55,0.8)]' : 'bg-mystic-muted/30'}`}
              />
            ))}
          </div>
          <button
            onClick={() => goTo(pageIdx + 1)}
            disabled={pageIdx === pages.length - 1}
            className="w-8 h-8 rounded-full bg-mystic-card/70 border border-mystic-gold/25 text-mystic-text flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
          >
            ›
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-mystic-muted mt-5">{T.hint[l]}</p>

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
