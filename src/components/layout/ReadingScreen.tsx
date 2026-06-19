'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import TarotCard from '@/components/cards/TarotCard';
import { hapticSuccess } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const T = {
  back: { ru: 'Назад', uk: 'Назад', en: 'Back' },
  noResult: { ru: 'Нет результата', uk: 'Немає результату', en: 'No result' },
  revealing: { ru: 'Карты открываются...', uk: 'Карти відкриваються...', en: 'Revealing cards...' },
  interpretation: { ru: 'Толкование', uk: 'Тлумачення', en: 'Interpretation' },
  again: { ru: 'Ещё раз', uk: 'Ще раз', en: 'Again' },
  share: { ru: 'Поделиться', uk: 'Поділитися', en: 'Share' },
  shareText: { ru: 'Мой расклад в Магии Карт ✨', uk: 'Мій розклад у Магії Карт ✨', en: 'My reading in Card Magic ✨' },
  loading: { ru: 'Звёзды говорят...', uk: 'Зірки говорять...', en: 'The stars are speaking...' },
  vision: { ru: 'Мистическое видение', uk: 'Містичне бачення', en: 'Mystic Vision' },
  cross: { ru: 'Крест', uk: 'Хрест', en: 'Cross' },
  staff: { ru: 'Посох', uk: 'Посох', en: 'Staff' },
};

/** Resolve card name to locale string (DB stores as {ru,uk,en} object) */
function resolveCardName(name: any, l: L): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object') return name[l] || name.ru || name.en || '';
  return '';
}

/** Resolve card keywords to locale string array (DB stores as {ru,uk,en} object) */
function resolveKeywords(keywords: any, l: L): string[] {
  if (Array.isArray(keywords)) return keywords;
  if (keywords && typeof keywords === 'object') {
    const localeKw = keywords[l] || keywords.ru || keywords.en;
    return Array.isArray(localeKw) ? localeKw : [];
  }
  return [];
}

// ─── Celtic Cross Layout ────────────────────────────────────────────────────

/**
 * Classic Celtic Cross layout:
 *
 * CROSS (left):           STAFF (right):
 *        [4]                [10]
 *   [5] [1+2] [6]          [9]
 *        [3]                [8]
 *                           [7]
 *
 * Positions (0-indexed):
 * 0 = Center/Theme, 1 = Crossing/Influence (rotated 90°),
 * 2 = Below/Foundation, 3 = Above/Goal,
 * 4 = Past, 5 = Future,
 * 6 = Yourself, 7 = Others, 8 = Hopes/Fears, 9 = Outcome
 */
function CelticCrossLayout({
  cards,
  revealedCards,
  positions,
  l,
  isReview,
}: {
  cards: any[];
  revealedCards: Set<number>;
  positions?: Array<Record<string, string>>;
  l: L;
  isReview: boolean;
}) {
  const renderCard = (index: number) => {
    const card = cards[index];
    if (!card) return null;
    return (
      <TarotCard
        id={card.id}
        name={resolveCardName(card.name, l)}
        image={card.image}
        reversed={card.reversed}
        revealed={revealedCards.has(index)}
        delay={0}
        position={positions?.[index]?.[l]}
        keywords={resolveKeywords(card.keywords, l)}
        size="mini"
      />
    );
  };

  const dealAnim = (index: number, children: React.ReactNode) => (
    <div
      className={isReview ? '' : 'animate-card-deal'}
      style={isReview ? {} : {
        animationDelay: `${index * 0.15}s`,
        opacity: 0,
        animationFillMode: 'forwards',
      }}
    >
      {children}
    </div>
  );

  /** Gold numbered badge */
  const badge = (n: number) => (
    <div className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-mystic-accent/90 text-mystic-bg text-[9px] font-bold flex items-center justify-center z-30 shadow-sm">
      {n}
    </div>
  );

  return (
    <div className="flex justify-center items-start gap-4 sm:gap-6">
      {/* ── Cross section (3×3 grid) ── */}
      <div className="grid grid-cols-3 gap-[6px] justify-items-center items-center">
        {/* Row 1: _ , Above(3), _ */}
        <div />
        <div className="relative">
          {badge(4)}
          {dealAnim(3, renderCard(3))}
        </div>
        <div />

        {/* Row 2: Past(4), Center(0)+Crossing(1), Future(5) */}
        <div className="relative">
          {badge(5)}
          {dealAnim(4, renderCard(4))}
        </div>

        {/* Center cell — two cards stacked, card 2 rotated 90° */}
        <div className="relative" style={{ overflow: 'visible' }}>
          {badge(1)}
          <div className="relative z-0">
            {dealAnim(0, renderCard(0))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="rotate-90 pointer-events-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              {dealAnim(1, <div className="relative">{badge(2)}{renderCard(1)}</div>)}
            </div>
          </div>
        </div>

        <div className="relative">
          {badge(6)}
          {dealAnim(5, renderCard(5))}
        </div>

        {/* Row 3: _ , Below(2), _ */}
        <div />
        <div className="relative">
          {badge(3)}
          {dealAnim(2, renderCard(2))}
        </div>
        <div />
      </div>

      {/* ── Staff column (vertical, bottom→top: 7,8,9,10) ── */}
      <div className="flex flex-col gap-[6px] items-center">
        <div className="relative">
          {badge(10)}
          {dealAnim(9, renderCard(9))}
        </div>
        <div className="relative">
          {badge(9)}
          {dealAnim(8, renderCard(8))}
        </div>
        <div className="relative">
          {badge(8)}
          {dealAnim(7, renderCard(7))}
        </div>
        <div className="relative">
          {badge(7)}
          {dealAnim(6, renderCard(6))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Reading Screen ────────────────────────────────────────────────────


// ─── Follow-up Question Section ─────────────────────────────────────────────

function FollowUpSection({ readingId, locale }: { readingId: string; locale: L }) {
  const { spendMana } = useAppStore();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const T_fu = {
    ask: { ru: 'Задать вопрос по раскладу', uk: 'Задати питання по розкладу', en: 'Ask about this reading' },
    placeholder: { ru: 'Что ещё хочешь узнать?..', uk: 'Що ще хочеш дізнатися?..', en: 'What else do you want to know?..' },
    send: { ru: 'Спросить (50 💎)', uk: 'Запитати (50 💎)', en: 'Ask (50 💎)' },
    thinking: { ru: 'Карты отвечают...', uk: 'Карти відповідають...', en: 'The cards are answering...' },
  };

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    const tg = (window as any).Telegram?.WebApp;
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg?.initData || '', readingId, question: question.trim() }),
      });
      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
        setAsked(true);
        hapticSuccess();
        if (data.newMana !== undefined) spendMana(0);
      } else if (data.needsMana) {
        tg?.showAlert?.('Недостаточно оракулов!');
      }
    } catch {
      console.error('Follow-up error');
    } finally {
      setLoading(false);
    }
  };

  if (asked && answer) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="mt-4 bg-mystic-card/80 rounded-2xl p-4 border border-mystic-blue/30">
        <p className="text-xs text-mystic-muted mb-2">💬 {question}</p>
        <div className="reading-text">
          {answer.split('\n').filter((p: string) => p.trim()).map((p: string, i: number) => (
            <p key={i} className="text-sm text-mystic-text/90 leading-relaxed mb-2">{p}</p>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      className="mt-4 bg-mystic-card/60 rounded-2xl p-4 border border-mystic-accent/10">
      <p className="text-xs text-mystic-muted mb-2">💬 {T_fu.ask[locale]}</p>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={T_fu.placeholder[locale]}
          className="flex-1 bg-mystic-bg/60 rounded-xl px-3 py-2 text-sm text-mystic-text placeholder:text-mystic-muted/40 border border-mystic-accent/10 focus:border-mystic-accent/30 outline-none"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-mystic-purple to-mystic-blue text-mystic-text text-xs font-bold whitespace-nowrap disabled:opacity-40"
        >
          {loading ? '...' : T_fu.send[locale]}
        </button>
      </div>
    </motion.div>
  );
}


export default function ReadingScreen() {
  const { currentReading, selectedSpread, locale, goBack } = useAppStore();
  const l = (locale || 'ru') as L;

  const cards = currentReading?.cards || [];
  const hasCards = cards.length > 0;
  const generatedImage = currentReading?.generatedImage;
  const isCelticCross = currentReading?.spreadId === 'celtic_cross' && cards.length === 10;

  // If reading is already complete (e.g. re-viewing card of day), skip animation
  const isReview = !!(currentReading as any)?.alreadyDrawn || currentReading?.spreadId === 'card_of_day';

  const [revealedCards, setRevealedCards] = useState<Set<number>>(
    new Set(isReview ? cards.map((_, i) => i) : []),
  );
  const [showInterpretation, setShowInterpretation] = useState(isReview);
  const [allRevealed, setAllRevealed] = useState(isReview);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isReview) {
      setRevealedCards(new Set(cards.map((_, i) => i)));
      setAllRevealed(true);
      setShowInterpretation(true);
      return;
    }

    if (!hasCards) {
      setShowInterpretation(true);
      return;
    }

    // Faster reveal for Celtic Cross (10 cards would take 7s at 600ms each)
    const revealInterval = isCelticCross ? 400 : 600;

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
      }, 800 + i * revealInterval);
    });
  }, [cards, hasCards, isReview, isCelticCross]);

  if (!currentReading) {
    return (
      <div className="px-4 pt-4 relative z-10">
        <button onClick={goBack} className="text-mystic-accent mb-4 text-sm">← {T.back[l]}</button>
        <p className="text-mystic-muted">{T.noResult[l]}</p>
      </div>
    );
  }

  const paragraphs = (currentReading.interpretation || '').split('\n').filter((p) => p.trim().length > 0);

  return (
    <div className="px-4 pt-4 pb-8 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <button onClick={goBack} className="text-mystic-accent text-sm">← {T.back[l]}</button>
        {selectedSpread && (
          <span className="text-sm text-mystic-muted">
            {selectedSpread.icon} {selectedSpread.name[l]?.replace(/^[\S]+\s/, '')}
          </span>
        )}
      </div>

      {/* Cards display */}
      {hasCards && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          {isCelticCross ? (
            /* Celtic Cross — classic cross + staff layout */
            <CelticCrossLayout
              cards={cards}
              revealedCards={revealedCards}
              positions={selectedSpread?.positions}
              l={l}
              isReview={isReview}
            />
          ) : (
            /* Default — flex wrap */
            <div className={`flex flex-wrap justify-center gap-3 mb-4 ${cards.length > 5 ? 'gap-2' : 'gap-3'}`}>
              {cards.map((card, i) => (
                <div key={i} className={isReview ? '' : 'animate-card-deal'}
                  style={isReview ? {} : { animationDelay: `${i * 0.15}s`, opacity: 0, animationFillMode: 'forwards' }}>
                  <TarotCard
                    id={card.id}
                    name={resolveCardName(card.name, l)}
                    image={card.image}
                    reversed={card.reversed}
                    revealed={revealedCards.has(i)}
                    delay={0}
                    position={selectedSpread?.positions?.[i]?.[l]}
                    keywords={resolveKeywords(card.keywords, l)}
                    size={cards.length > 5 ? 'small' : 'normal'}
                  />
                </div>
              ))}
            </div>
          )}
          {!allRevealed && <p className="text-center text-mystic-muted text-xs animate-pulse mt-3">{T.revealing[l]}</p>}
        </motion.div>
      )}

      {/* Generated mystic image */}
      {generatedImage && showInterpretation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="relative rounded-2xl overflow-hidden border border-mystic-accent/30 shadow-lg shadow-mystic-accent/10">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-mystic-gold/40 rounded-tl-2xl z-10" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-mystic-gold/40 rounded-tr-2xl z-10" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-mystic-gold/40 rounded-bl-2xl z-10" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-mystic-gold/40 rounded-br-2xl z-10" />
            <img
              src={generatedImage}
              alt={T.vision[l]}
              className={`w-full h-auto transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="w-full aspect-[3/2] bg-gradient-to-br from-mystic-card via-mystic-accent/5 to-mystic-card animate-pulse flex items-center justify-center">
                <span className="text-3xl animate-float">✨</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-mystic-bg/60 to-transparent" />
          </div>
          <p className="text-center text-[11px] text-mystic-muted/60 mt-2 tracking-wider uppercase">
            ✦ {T.vision[l]} ✦
          </p>
        </motion.div>
      )}

      {/* Interpretation */}
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
          <div className="mt-6 space-y-3">
            <button onClick={goBack}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg font-bold text-sm">
              ← {T.back[l]}
            </button>
          <div className="mt-3">
            <button onClick={() => {
              hapticSuccess();
              const tg = (window as any).Telegram?.WebApp;
              const text = `${T.shareText[l]}\n\n${paragraphs[0]?.slice(0, 150) || ''}...`;
              const botUrl = tg?.initDataUnsafe?.user ? `https://t.me/cardsofmagic_bot` : '';
              if (tg?.openTelegramLink) {
                tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(text)}`);
              }
            }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-mystic-blue to-mystic-purple text-mystic-text font-bold text-sm">
              📤 {T.share[l]}
            </button>
          </div>
          </div>
        </motion.div>
      )}

      {/* Follow-up question */}
      {showInterpretation && currentReading?.id && (
        <FollowUpSection readingId={currentReading.id} locale={l} />
      )}

      {/* Loading state (esoteric spreads with no cards) */}
      {!showInterpretation && !hasCards && (
        <div className="text-center py-12">
          <div className="text-5xl animate-float mb-4">🔮</div>
          <p className="text-mystic-muted animate-pulse">{T.loading[l]}</p>
        </div>
      )}
    </div>
  );
}
