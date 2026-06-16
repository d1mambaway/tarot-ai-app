'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';

export default function SpreadScreen() {
  const {
    selectedSpread, locale, setScreen, goBack, setCurrentReading,
    setGenerating, addToHistory, user, spendMana, setManaModal,
  } = useAppStore();
  const l = locale || 'ru';
  const [question, setQuestion] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerSign, setPartnerSign] = useState('');
  const [dreamText, setDreamText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  if (!selectedSpread) {
    return (
      <div className="px-4 pt-4 relative z-10">
        <button onClick={goBack} className="text-mystic-accent mb-4">← {l === 'uk' ? 'Назад' : 'Назад'}</button>
        <p className="text-mystic-muted">{l === 'uk' ? 'Розклад не обрано' : 'Расклад не выбран'}</p>
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
      case 'photo': return false;
      default: return true;
    }
  };

  const startReading = async () => {
    // Check mana
    if (spread.manaCost > 0) {
      const currentMana = user?.mana ?? 0;
      if (currentMana < spread.manaCost) {
        setManaModal(true, spread.manaCost);
        return;
      }
      // Spend mana
      const ok = spendMana(spread.manaCost);
      if (!ok) {
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

      // Try DB-backed API first, fallback to lite
      let res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 500 || res.status === 401) {
        res = await fetch('/api/reading-lite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.status === 402) {
        setError(l === 'uk' ? 'Потрібна оплата ⭐' : 'Нужна оплата ⭐');
        setIsStarting(false);
        setGenerating(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      const reading = {
        id: data.id,
        spreadId: spread.id,
        cards: data.cards || [],
        interpretation: data.interpretation,
        createdAt: new Date().toISOString(),
        question: question || undefined,
      };

      setCurrentReading(reading);
      addToHistory(reading);
      setScreen('reading');
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setIsStarting(false);
      setGenerating(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-8 relative z-10">
      <button onClick={goBack} className="text-mystic-accent mb-4 text-sm flex items-center gap-1">
        ← {l === 'uk' ? 'Назад' : 'Назад'}
      </button>

      {/* Spread info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <span className="text-5xl block mb-3">{spread.icon}</span>
        <h1 className="text-2xl font-bold font-mystic text-gradient-gold">
          {spread.name[l].replace(/^[\S]+\s/, '')}
        </h1>
        <p className="text-mystic-muted text-sm mt-2 max-w-xs mx-auto">
          {spread.description[l]}
        </p>

        {/* Detail chips */}
        <div className="flex items-center justify-center gap-3 mt-3">
          {spread.cardCount > 0 && (
            <span className="text-[11px] bg-mystic-card px-2.5 py-1 rounded-full text-mystic-muted border border-mystic-accent/20">
              🃏 {spread.cardCount} {l === 'uk' ? 'карт' : 'карт'}
            </span>
          )}
          <span className="text-[11px] bg-mystic-card px-2.5 py-1 rounded-full text-mystic-muted border border-mystic-accent/20 flex items-center gap-1">
            {spread.manaCost === 0 ? (
              <>{l === 'uk' ? '✦ Безкоштовно' : '✦ Бесплатно'}</>
            ) : (
              <span className="flex items-center gap-0.5">
                <ManaIcon size="sm" /> {spread.manaCost}
              </span>
            )}
          </span>
        </div>
      </motion.div>

      {/* Positions preview */}
      {spread.positions && spread.positions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 bg-mystic-card/60 rounded-xl p-4 border border-mystic-accent/10"
        >
          <p className="text-xs text-mystic-muted mb-2 uppercase tracking-wider">
            {l === 'uk' ? 'Позиції карт' : 'Позиции карт'}
          </p>
          <div className="space-y-1.5">
            {spread.positions.map((pos, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-mystic-accent/20 text-mystic-accent text-[11px] flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="text-mystic-text/80">{pos[l]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        {spread.requiresInput === 'question' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
              {l === 'uk' ? 'Твоє запитання' : 'Твой вопрос'}
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={l === 'uk' ? 'Що тебе хвилює?..' : 'Что тебя волнует?..'}
              className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 resize-none h-24 focus:border-mystic-accent/50 focus:outline-none transition"
            />
          </div>
        )}

        {spread.requiresInput === 'name' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
              {l === 'uk' ? 'Ім\'я людини' : 'Имя человека'}
            </label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={l === 'uk' ? 'Наприклад: Олександр' : 'Например: Александр'}
              className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-accent/50 focus:outline-none transition"
            />
          </div>
        )}

        {spread.requiresInput === 'dream_text' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
              {l === 'uk' ? 'Опиши свій сон' : 'Опиши свой сон'}
            </label>
            <textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={l === 'uk' ? 'Мені снилось що...' : 'Мне приснилось что...'}
              className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 resize-none h-32 focus:border-mystic-accent/50 focus:outline-none transition"
            />
          </div>
        )}

        {spread.requiresInput === 'number' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
              {l === 'uk' ? 'Число' : 'Число'}
            </label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="111, 222, 333..."
              className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-accent/50 focus:outline-none transition"
            />
          </div>
        )}

        {spread.requiresInput === 'date' && (
          <div>
            <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
              {l === 'uk' ? 'Дата народження' : 'Дата рождения'}
            </label>
            <input
              type="date"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text focus:border-mystic-accent/50 focus:outline-none transition"
            />
          </div>
        )}

        {spread.requiresInput === 'two_people' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
                {l === 'uk' ? 'Ім\'я партнера' : 'Имя партнёра'}
              </label>
              <input
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder={l === 'uk' ? 'Ім\'я' : 'Имя'}
                className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-accent/50 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">
                {l === 'uk' ? 'Знак зодіаку / дата' : 'Знак зодиака / дата'}
              </label>
              <input
                value={partnerSign}
                onChange={(e) => setPartnerSign(e.target.value)}
                placeholder={l === 'uk' ? 'Наприклад: Лев або 15.08.1995' : 'Например: Лев или 15.08.1995'}
                className="w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-accent/50 focus:outline-none transition"
              />
            </div>
          </div>
        )}

        {spread.requiresInput === 'photo' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-mystic-muted text-sm">
              {l === 'uk' ? 'Функція фото скоро буде доступна' : 'Функция фото скоро будет доступна'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-4 text-center text-mystic-danger text-sm bg-mystic-danger/10 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Start button */}
      {spread.requiresInput !== 'photo' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={startReading}
          disabled={!canStart() || isStarting}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            canStart() && !isStarting
              ? 'bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-gold text-mystic-bg glow-strong active:scale-[0.98]'
              : 'bg-mystic-card text-mystic-muted border border-mystic-accent/10'
          }`}
        >
          {isStarting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🔮</span>
              {l === 'uk' ? 'Карти кажуть...' : 'Карты говорят...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔮 {l === 'uk' ? 'Почати розклад' : 'Начать расклад'}
              {spread.manaCost > 0 && (
                <span className="flex items-center gap-0.5 text-sm opacity-80">
                  • <ManaIcon size="sm" /> {spread.manaCost}
                </span>
              )}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}
