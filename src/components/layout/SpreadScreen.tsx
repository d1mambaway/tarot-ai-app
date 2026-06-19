'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import Image from 'next/image';
// Card of day is now handled via /api/card-of-day in HomeScreen

type L = 'ru' | 'uk' | 'en';

const T = {
  back: { ru: 'Назад', uk: 'Назад', en: 'Back' },
  noSpread: { ru: 'Расклад не выбран', uk: 'Розклад не обрано', en: 'No spread selected' },
  cards: { ru: 'карт', uk: 'карт', en: 'cards' },
  free: { ru: '✦ Бесплатно', uk: '✦ Безкоштовно', en: '✦ Free' },
  positions: { ru: 'Позиции карт', uk: 'Позиції карт', en: 'Card positions' },
  yourQ: { ru: 'Твой вопрос', uk: 'Твоє запитання', en: 'Your question' },
  qPlaceholder: { ru: 'Что тебя волнует?..', uk: 'Що тебе хвилює?..', en: 'What\'s on your mind?..' },
  nameLbl: { ru: 'Имя человека', uk: 'Ім\'я людини', en: 'Person\'s name' },
  namePh: { ru: 'Например: Александр', uk: 'Наприклад: Олександр', en: 'e.g. Alex' },
  dreamLbl: { ru: 'Опиши свой сон', uk: 'Опиши свій сон', en: 'Describe your dream' },
  dreamPh: { ru: 'Мне приснилось что...', uk: 'Мені снилось що...', en: 'I dreamed that...' },
  numLbl: { ru: 'Число', uk: 'Число', en: 'Number' },
  dateLbl: { ru: 'Дата рождения', uk: 'Дата народження', en: 'Birth date' },
  partnerLbl: { ru: 'Имя партнёра', uk: 'Ім\'я партнера', en: 'Partner\'s name' },
  partnerPh: { ru: 'Имя', uk: 'Ім\'я', en: 'Name' },
  signLbl: { ru: 'Знак зодиака / дата', uk: 'Знак зодіаку / дата', en: 'Zodiac sign / date' },
  signPh: { ru: 'Например: Лев или 15.08.1995', uk: 'Наприклад: Лев або 15.08.1995', en: 'e.g. Leo or 08/15/1995' },
  payNeeded: { ru: 'Нужна оплата ⭐', uk: 'Потрібна оплата ⭐', en: 'Payment required ⭐' },
  thinking: { ru: 'Карты говорят...', uk: 'Карти кажуть...', en: 'The cards are speaking...' },
  start: { ru: 'Начать расклад', uk: 'Почати розклад', en: 'Start reading' },
};

export default function SpreadScreen() {
  const {
    selectedSpread, locale, setScreen, goBack, setCurrentReading,
    setGenerating, addToHistory, user, spendMana, setManaModal,
  } = useAppStore();
  const l = (locale || 'ru') as L;
  const [question, setQuestion] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerSign, setPartnerSign] = useState('');
  const [dreamText, setDreamText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  if (!selectedSpread) {
    return (
      <div className="px-4 pt-4 relative z-10">
        <button onClick={goBack} className="text-mystic-accent mb-4">← {T.back[l]}</button>
        <p className="text-mystic-muted">{T.noSpread[l]}</p>
      </div>
    );
  }

  const spread = selectedSpread;

  const canStart = () => {
    switch (spread.requiresInput) {
      case 'none': return true;
      case 'question': return question.trim().length > 2;
      case 'name': return question.trim().length > 0;
      case 'dream_text': return dreamText.trim().length > 10;
      case 'number': return question.trim().length > 0;
      case 'date': return question.trim().length > 0;
      case 'two_people': return partnerName.trim().length > 0;
      default: return true;
    }
  };

  const startReading = async () => {
    // Check mana client-side (UI guard only; server deducts the actual mana)
    if (spread.manaCost > 0) {
      const currentMana = user?.mana ?? 0;
      if (currentMana < spread.manaCost) {
        setManaModal(true, spread.manaCost);
        return;
      }
    }

    setIsStarting(true);
    setError('');
    setGenerating(true);

    try {
      const tg = (window as any).Telegram?.WebApp;
      const body: Record<string, unknown> = {
        initData: tg?.initData || '',
        spreadId: spread.id,
        question: question || undefined,
        partnerName: partnerName || undefined,
        partnerSign: partnerSign || undefined,
        dreamText: dreamText || undefined,
        locale: l,
      };

      let res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Fallback to lite endpoint if the full one fails
      if (!res.ok && res.status !== 402) {
        res = await fetch('/api/reading-lite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.status === 402) {
        setError(T.payNeeded[l]);
        setIsStarting(false);
        setGenerating(false);
        return;
      }

      // Sync mana from server response
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      if (data.newMana !== undefined) {
        // Server is source of truth — sync client mana to server value
        const { setMana } = useAppStore.getState();
        setMana(data.newMana);
      } else if (spread.manaCost > 0) {
        // If server didn't return newMana, deduct client-side as fallback
        spendMana(spread.manaCost);
      }

      const reading = {
        id: data.id,
        spreadId: spread.id,
        cards: data.cards || [],
        interpretation: data.interpretation,
        createdAt: new Date().toISOString(),
        question: question || undefined,
        generatedImage: data.generatedImage || undefined,
      };

      setCurrentReading(reading);
      addToHistory(reading);
      setScreen('reading');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsStarting(false);
      setGenerating(false);
    }
  };

  const inputClass = "w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-accent/50 focus:outline-none transition";

  return (
    <div className="px-4 pt-4 pb-8 relative z-10">
      <button onClick={goBack} className="text-mystic-accent mb-4 text-sm flex items-center gap-1">← {T.back[l]}</button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        {spread.image ? (
          <div className="w-32 h-20 relative mx-auto mb-3 rounded-xl overflow-hidden">
            <Image src={spread.image} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <span className="text-5xl block mb-3">{spread.icon}</span>
        )}
        <h1 className="text-2xl font-bold font-mystic text-gradient-gold">
          {spread.name[l].replace(/^[\S]+\s/, '')}
        </h1>
        <p className="text-mystic-muted text-sm mt-2 max-w-xs mx-auto">{spread.description[l]}</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          {spread.cardCount > 0 && (
            <span className="text-[11px] bg-mystic-card px-2.5 py-1 rounded-full text-mystic-muted border border-mystic-accent/20">
              🃏 {spread.cardCount} {T.cards[l]}
            </span>
          )}
          <span className="text-[11px] bg-mystic-card px-2.5 py-1 rounded-full text-mystic-muted border border-mystic-accent/20 flex items-center gap-1">
            {spread.manaCost === 0 ? T.free[l] : <><ManaIcon size="sm" /> {spread.manaCost}</>}
          </span>
        </div>
      </motion.div>

      {spread.positions && spread.positions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="mb-6 bg-mystic-card/60 rounded-xl p-4 border border-mystic-accent/10">
          <p className="text-xs text-mystic-muted mb-2 uppercase tracking-wider">{T.positions[l]}</p>
          <div className="space-y-1.5">
            {spread.positions.map((pos, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-mystic-accent/20 text-mystic-accent text-[11px] flex items-center justify-center font-bold">{i + 1}</span>
                <span className="text-mystic-text/80">{pos[l]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        {spread.requiresInput === 'question' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.yourQ[l]}</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={T.qPlaceholder[l]}
              className={`${inputClass} resize-none h-24`} />
          </div>
        )}
        {spread.requiresInput === 'name' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.nameLbl[l]}</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={T.namePh[l]} className={inputClass} />
          </div>
        )}
        {spread.requiresInput === 'dream_text' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.dreamLbl[l]}</label>
            <textarea value={dreamText} onChange={(e) => setDreamText(e.target.value)} placeholder={T.dreamPh[l]}
              className={`${inputClass} resize-none h-32`} />
          </div>
        )}
        {spread.requiresInput === 'number' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.numLbl[l]}</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="111, 222, 333..." className={inputClass} />
          </div>
        )}
        {spread.requiresInput === 'date' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.dateLbl[l]}</label>
            <input type="date" value={question} onChange={(e) => setQuestion(e.target.value)} className={inputClass} />
          </div>
        )}
        {spread.requiresInput === 'two_people' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.partnerLbl[l]}</label>
              <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder={T.partnerPh[l]} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.signLbl[l]}</label>
              <input value={partnerSign} onChange={(e) => setPartnerSign(e.target.value)} placeholder={T.signPh[l]} className={inputClass} />
            </div>
          </div>
        )}
      </motion.div>

      {error && <div className="mb-4 text-center text-mystic-danger text-sm bg-mystic-danger/10 rounded-xl p-3">{error}</div>}

      <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={startReading} disabled={!canStart() || isStarting}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            canStart() && !isStarting
              ? 'bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-gold text-mystic-bg glow-strong active:scale-[0.98]'
              : 'bg-mystic-card text-mystic-muted border border-mystic-accent/10'
          }`}
        >
          {isStarting ? (
            <span className="flex items-center justify-center gap-2"><span className="animate-spin">🔮</span> {T.thinking[l]}</span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔮 {T.start[l]}
              {spread.manaCost > 0 && <span className="flex items-center gap-0.5 text-sm opacity-80">• <ManaIcon size="sm" /> {spread.manaCost}</span>}
            </span>
          )}
        </motion.button>
    </div>
  );
}
