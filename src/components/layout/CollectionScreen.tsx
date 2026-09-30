'use client';

/**
 * «Колоды» — the collection as a star map ("Путь Шута").
 * The 22 Major Arcana are stars on one winding path from the Fool to the
 * World; each suit is its own small constellation. Collected cards glow,
 * the rest stay dim. Tapping a collected star opens the card sheet.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { ALL_CARDS, type TarotCard } from '@/data/tarot-cards';
import { CONSTELLATIONS, ROMAN, SKY_H, SKY_W, type SkyKey } from '@/data/constellations';
import CardSheet from '@/components/ui/CardSheet';
import { hapticLight, hapticSelection } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const T = {
  path: { ru: 'Путь Шута', uk: 'Шлях Блазня', en: 'The Fool’s Journey' },
  constellation: { ru: 'Созвездие', uk: 'Сузір’я', en: 'Constellation' },
  titles: {
    major: { ru: 'Старшие арканы', uk: 'Старші аркани', en: 'Major Arcana' },
    wands: { ru: 'Жезлы', uk: 'Жезли', en: 'Wands' },
    cups: { ru: 'Кубки', uk: 'Кубки', en: 'Cups' },
    swords: { ru: 'Мечи', uk: 'Мечі', en: 'Swords' },
    pentacles: { ru: 'Пентакли', uk: 'Пентаклі', en: 'Pentacles' },
  } as Record<SkyKey, Record<L, string>>,
  total: { ru: 'Всего в колоде', uk: 'Усього в колоді', en: 'In this deck' },
  notYet: { ru: 'Эта карта ещё не выпадала — сделай расклад', uk: 'Ця карта ще не випадала — зроби розклад', en: 'Not drawn yet — do a reading' },
};

const SKY_ORDER: SkyKey[] = ['major', 'wands', 'cups', 'swords', 'pentacles'];

interface Owned { times: number; at?: string }

export default function CollectionScreen() {
  const { user, locale, navigateTab } = useAppStore();
  const l = (locale || 'ru') as L;

  const [sky, setSky] = useState<SkyKey>('major');
  const [owned, setOwned] = useState<Map<number, Owned>>(() => new Map());
  const [openCard, setOpenCard] = useState<TarotCard | null>(null);
  const [hint, setHint] = useState<number | null>(null);

  // Collected card ids come with the user already; details (times drawn,
  // first date) load here.
  useEffect(() => {
    const base = new Map<number, Owned>();
    for (const id of user?.cardCollection ?? []) base.set(id, { times: 1 });
    setOwned(base);

    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initData) return;
    let cancelled = false;
    fetch(`/api/collection?initData=${encodeURIComponent(tg.initData)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data.cards)) return;
        setOwned(new Map(data.cards.map((c: { id: number; times: number; at: string }) => [c.id, { times: c.times, at: c.at }])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { points, firstCardId } = CONSTELLATIONS[sky];
  const cardsInSky = useMemo(() => points.map((_, i) => ALL_CARDS[firstCardId + i]), [points, firstCardId]);
  const ownedIn = (key: SkyKey) => {
    const { points: p, firstCardId: f } = CONSTELLATIONS[key];
    return p.filter((_, i) => owned.has(f + i)).length;
  };

  const tapStar = (card: TarotCard) => {
    hapticLight();
    if (owned.has(card.id)) {
      setOpenCard(card);
      setHint(null);
    } else {
      setHint(card.id);
      setTimeout(() => setHint((h) => (h === card.id ? null : h)), 2200);
    }
  };

  const hintCard = hint !== null ? cardsInSky.findIndex((c) => c.id === hint) : -1;

  return (
    <div className="px-4 pt-5 pb-6 relative z-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="t-overline !text-lavender">{sky === 'major' ? T.path[l] : T.constellation[l]}</p>
          <h1 className="t-screen">{T.titles[sky][l]}</h1>
        </div>
        <span className="text-sm text-ink-2 tabular-nums pb-1">{ownedIn(sky)} / {points.length}</span>
      </div>

      {/* Sky */}
      <div className="relative w-full mt-3" style={{ aspectRatio: `${SKY_W} / ${SKY_H}` }}>
        <svg viewBox={`0 0 ${SKY_W} ${SKY_H}`} className="absolute inset-0 w-full h-full" aria-hidden>
          {points.slice(0, -1).map(([x, y], i) => {
            const [x2, y2] = points[i + 1];
            const lit = owned.has(firstCardId + i) && owned.has(firstCardId + i + 1);
            return (
              <line
                key={i}
                x1={x} y1={y} x2={x2} y2={y2}
                stroke={lit ? 'rgba(233,201,122,0.5)' : 'rgba(185,167,240,0.14)'}
                strokeWidth={1}
              />
            );
          })}
        </svg>

        {cardsInSky.map((card, i) => {
          const [x, y] = points[i];
          const isOwned = owned.has(card.id);
          const label = sky === 'major' ? ROMAN[card.id] : String(i + 1);
          return (
            <button
              key={`${sky}-${card.id}`}
              onClick={() => tapStar(card)}
              aria-label={isOwned ? card.name[l] : label}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
              style={{ left: `${(x / SKY_W) * 100}%`, top: `${(y / SKY_H) * 100}%` }}
            >
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.025, duration: 0.35 }}
                className={isOwned ? 'star-on' : 'star-off'}
              />
              <span className={`absolute top-[30px] text-micro whitespace-nowrap ${isOwned ? 'text-ink-2' : 'text-ink-3/60'}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* "Not drawn yet" hint next to a dim star */}
        <AnimatePresence>
          {hintCard >= 0 && (
            <motion.div
              key={hint}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-10 max-w-[200px] px-3 py-2 rounded-[14px] bg-night-800/95 border border-mystic-gold/30 text-xs text-ink-2 shadow-lg"
              style={{
                left: `${Math.min(Math.max((points[hintCard][0] / SKY_W) * 100, 25), 75)}%`,
                top: `${(points[hintCard][1] / SKY_H) * 100}%`,
                transform: 'translate(-50%, 18px)',
              }}
            >
              {T.notYet[l]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Constellation switcher */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {SKY_ORDER.map((key) => {
          const active = key === sky;
          const { points: p } = CONSTELLATIONS[key];
          return (
            <button
              key={key}
              onClick={() => { hapticSelection(); setSky(key); setHint(null); }}
              className={`brand-card px-3 py-2.5 flex items-center gap-2.5 text-left ${key === 'major' ? 'col-span-2' : ''} ${active ? '!border-mystic-gold/55' : ''}`}
            >
              <MiniConstellation keyName={key} lit={ownedIn(key)} />
              <span className="flex flex-col min-w-0">
                <span className={`font-display font-semibold text-lg leading-5 ${active ? 'text-gold-soft' : 'text-ink'}`}>{T.titles[key][l]}</span>
                <span className="text-xs text-ink-2 tabular-nums">{ownedIn(key)} / {p.length}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-ink-3 tabular-nums">
        {T.total[l]}: {owned.size} / {ALL_CARDS.length}
      </p>


      <CardSheet
        card={openCard}
        times={openCard ? owned.get(openCard.id)?.times : undefined}
        firstAt={openCard ? owned.get(openCard.id)?.at : undefined}
        locale={l}
        onClose={() => setOpenCard(null)}
        onReading={() => { setOpenCard(null); navigateTab('tarot'); }}
      />
    </div>
  );
}

/** Small preview of a constellation for the switcher tiles */
function MiniConstellation({ keyName, lit }: { keyName: SkyKey; lit: number }) {
  const { points } = CONSTELLATIONS[keyName];
  const step = Math.max(1, Math.floor(points.length / 6));
  const pts = points.filter((_, i) => i % step === 0).slice(0, 6);
  const litDots = Math.round((lit / points.length) * pts.length);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x / SKY_W) * 40} ${(y / SKY_H) * 26}`).join(' ');
  return (
    <svg width="40" height="26" viewBox="0 0 40 26" className="shrink-0" aria-hidden>
      <path d={d} fill="none" stroke="rgba(233,201,122,0.4)" strokeWidth="0.8" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={(x / SKY_W) * 40} cy={(y / SKY_H) * 26} r={i < litDots ? 1.9 : 1.3} fill={i < litDots ? '#e9c97a' : '#5c566e'} />
      ))}
    </svg>
  );
}
