'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import TarotCard from '@/components/cards/TarotCard';
import { hapticSuccess } from '@/lib/haptics';
import { playRevealChime } from '@/lib/sounds';

type L = 'ru' | 'uk' | 'en';

const T = {
  back: { ru: 'Назад', uk: 'Назад', en: 'Back' },
  noResult: { ru: 'Нет результата', uk: 'Немає результату', en: 'No result' },
  tapToReveal: { ru: '✨ Нажми чтобы раскрыть ✨', uk: '✨ Натисни щоб розкрити ✨', en: '✨ Tap to reveal ✨' },
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

function CelticCrossLayout({
  cards,
  positions,
  l,
  isReview,
  onCardReveal,
}: {
  cards: any[];
  positions?: Array<Record<string, string>>;
  l: L;
  isReview: boolean;
  onCardReveal?: (index: number) => void;
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
        revealed={isReview}
        onReveal={() => onCardReveal?.(index)}
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
        <div />
        <div className="relative">
          {badge(4)}
          {dealAnim(3, renderCard(3))}
        </div>
        <div />

        <div className="relative">
          {badge(5)}
          {dealAnim(4, renderCard(4))}
        </div>

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

        <div />
        <div className="relative">
          {badge(3)}
          {dealAnim(2, renderCard(2))}
        </div>
        <div />
      </div>

      {/* ── Staff column ── */}
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


// ─── Journal Notes (localStorage) ────────────────────────────────────────────

function getReadingKey(reading: any): string {
  return reading?.id || reading?.spreadId + '_' + (reading?.createdAt || '');
}

function getNote(key: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(`mk_note_${key}`) || '';
}

function saveNote(key: string, note: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mk_note_${key}`, note);
  }
}

const noteT = {
  addNote: { ru: '📝 Добавить заметку', uk: '📝 Додати нотатку', en: '📝 Add Note' },
  placeholder: { ru: 'Запишите свои мысли, ощущения, инсайты...', uk: 'Запишіть свої думки, відчуття, інсайти...', en: 'Write your thoughts, feelings, insights...' },
  save: { ru: 'Сохранить', uk: 'Зберегти', en: 'Save' },
  saved: { ru: '✅ Сохранено', uk: '✅ Збережено', en: '✅ Saved' },
  yourNote: { ru: '📝 Ваша заметка', uk: '📝 Ваша нотатка', en: '📝 Your Note' },
  edit: { ru: 'Изменить', uk: 'Змінити', en: 'Edit' },
};

function NoteSection({ reading, locale }: { reading: any; locale: L }) {
  const key = getReadingKey(reading);
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [existingNote, setExistingNote] = useState('');

  useEffect(() => {
    const existing = getNote(key);
    setExistingNote(existing);
    setNote(existing);
    if (existing) setIsOpen(true);
  }, [key]);

  const handleSave = () => {
    saveNote(key, note);
    setExistingNote(note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const l = locale;

  if (existingNote && !isOpen) {
    return (
      <div className="bg-mystic-card/60 rounded-2xl p-4 border border-mystic-accent/15 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-mystic-accent">{noteT.yourNote[l]}</span>
          <button onClick={() => setIsOpen(true)} className="text-[10px] text-mystic-accent/70 underline">
            {noteT.edit[l]}
          </button>
        </div>
        <p className="text-xs text-mystic-text/80 leading-relaxed whitespace-pre-wrap">{existingNote}</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-2xl border border-dashed border-mystic-accent/25 text-sm text-mystic-accent/70 hover:border-mystic-accent/40 transition-colors mb-4"
      >
        {noteT.addNote[l]}
      </button>
    );
  }

  return (
    <div className="bg-mystic-card/60 rounded-2xl p-4 border border-mystic-accent/15 mb-4">
      <p className="text-xs font-bold text-mystic-accent mb-2">{noteT.addNote[l]}</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={noteT.placeholder[l]}
        rows={3}
        className="w-full bg-mystic-bg/40 rounded-xl px-3 py-2.5 text-xs text-mystic-text placeholder:text-mystic-muted/40 border border-mystic-accent/10 focus:border-mystic-accent/30 outline-none resize-none mb-2 leading-relaxed"
      />
      <div className="flex justify-end gap-2">
        <button onClick={() => { setIsOpen(false); setNote(existingNote); }} className="px-3 py-1.5 rounded-xl text-[11px] text-mystic-muted">
          ✕
        </button>
        <button
          onClick={handleSave}
          disabled={!note.trim()}
          className="px-4 py-1.5 rounded-xl bg-mystic-accent/20 text-[11px] text-mystic-accent font-bold border border-mystic-accent/20 disabled:opacity-40"
        >
          {saved ? noteT.saved[l] : noteT.save[l]}
        </button>
      </div>
    </div>
  );
}


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
    send: { ru: 'Спросить (111 💎)', uk: 'Запитати (111 💎)', en: 'Ask (111 💎)' },
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


// ─── Main Reading Screen ────────────────────────────────────────────────────

export default function ReadingScreen() {
  const { currentReading, selectedSpread, locale, goBack } = useAppStore();
  const l = (locale || 'ru') as L;

  const cards = currentReading?.cards || [];
  const hasCards = cards.length > 0;
  const generatedImage = currentReading?.generatedImage;
  const isCelticCross = currentReading?.spreadId === 'celtic_cross' && cards.length === 10;

  // Only skip animation for already-drawn readings (re-viewing)
  const isReview = !!(currentReading as any)?.alreadyDrawn;

  // ── Tap-to-reveal state ──
  const revealedSet = useRef(new Set<number>());
  const [revealedCount, setRevealedCount] = useState(isReview ? cards.length : 0);
  const allRevealed = !hasCards || isReview || revealedCount >= cards.length;
  const [showInterpretation, setShowInterpretation] = useState(isReview || !hasCards);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Show interpretation immediately for review / no-card spreads
  useEffect(() => {
    if (isReview || !hasCards) {
      setShowInterpretation(true);
    }
  }, [isReview, hasCards]);

  // Reset reveal tracking when reading changes
  useEffect(() => {
    if (!isReview && hasCards) {
      revealedSet.current = new Set();
      setRevealedCount(0);
      setShowInterpretation(false);
    }
  }, [currentReading?.id, isReview, hasCards]);

  const handleCardReveal = useCallback((index: number) => {
    if (revealedSet.current.has(index)) return;
    revealedSet.current.add(index);
    const count = revealedSet.current.size;
    setRevealedCount(count);

    if (count >= cards.length) {
      hapticSuccess();
      playRevealChime();
      setTimeout(() => setShowInterpretation(true), 800);
    }
  }, [cards.length]);

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
            <CelticCrossLayout
              cards={cards}
              positions={selectedSpread?.positions}
              l={l}
              isReview={isReview}
              onCardReveal={handleCardReveal}
            />
          ) : (
            <div className={`flex flex-wrap justify-center gap-3 mb-4 ${cards.length > 5 ? 'gap-2' : 'gap-3'}`}>
              {cards.map((card, i) => (
                <div key={i} className={isReview ? '' : 'animate-card-deal'}
                  style={isReview ? {} : { animationDelay: `${i * 0.15}s`, opacity: 0, animationFillMode: 'forwards' }}>
                  <TarotCard
                    id={card.id}
                    name={resolveCardName(card.name, l)}
                    image={card.image}
                    reversed={card.reversed}
                    revealed={isReview}
                    onReveal={() => handleCardReveal(i)}
                    delay={0}
                    position={selectedSpread?.positions?.[i]?.[l]}
                    keywords={resolveKeywords(card.keywords, l)}
                    size={cards.length > 5 ? 'small' : 'normal'}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tap hint — shown while cards are face-down */}
          {!allRevealed && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-mystic-accent/80 text-xs animate-pulse mt-3"
            >
              {T.tapToReveal[l]}
            </motion.p>
          )}
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
                const userId = tg?.initDataUnsafe?.user?.id;
                const botUrl = userId ? `https://t.me/cardsofmagic_bot?start=ref_${userId}` : 'https://t.me/cardsofmagic_bot';
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

      {/* Journal note */}
      {showInterpretation && (
        <NoteSection reading={currentReading} locale={l} />
      )}

      {/* Follow-up question */}
      {showInterpretation && currentReading?.id && (
        <FollowUpSection readingId={currentReading.id || currentReading.spreadId} locale={l} />
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
