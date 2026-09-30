'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import NatalLoadingScreen from '@/components/ui/NatalLoadingScreen';
import Image from 'next/image';
import { formatTodayShort } from '@/lib/date';
import { effectivePrice } from '@/lib/pricing';
import { cardsLabel } from '@/lib/plural';
import PriceTag from '@/components/ui/PriceTag';
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
  natalDateLbl: { ru: 'Дата рождения', uk: 'Дата народження', en: 'Birth date' },
  natalTimeLbl: { ru: 'Время рождения', uk: 'Час народження', en: 'Birth time' },
  natalTimePh: { ru: 'Например: 14:30', uk: 'Наприклад: 14:30', en: 'e.g. 14:30' },
  natalCityLbl: { ru: 'Город рождения', uk: 'Місто народження', en: 'Birth city' },
  natalCityPh: { ru: 'Например: Барселона', uk: 'Наприклад: Київ', en: 'e.g. Barcelona' },
  partnerLbl: { ru: 'Имя партнёра', uk: 'Ім\'я партнера', en: 'Partner\'s name' },
  partnerPh: { ru: 'Имя', uk: 'Ім\'я', en: 'Name' },
  signLbl: { ru: 'Знак зодиака / дата', uk: 'Знак зодіаку / дата', en: 'Zodiac sign / date' },
  signPh: { ru: 'Например: Лев или 15.08.1995', uk: 'Наприклад: Лев або 15.08.1995', en: 'e.g. Leo or 08/15/1995' },
  payNeeded: { ru: 'Нужна оплата ⭐', uk: 'Потрібна оплата ⭐', en: 'Payment required ⭐' },
  premiumOnly: { ru: 'Этот расклад доступен только с Premium 👑', uk: 'Цей розклад доступний лише з Premium 👑', en: 'This spread is Premium only 👑' },
  thinking: { ru: 'Карты говорят...', uk: 'Карти кажуть...', en: 'The cards are speaking...' },
  bigUsed: {
    ru: 'Бесплатный большой отчёт этого месяца уже использован. Нужно {n} оракулов — пополни в магазине',
    uk: 'Безкоштовний великий звіт цього місяця вже використано. Потрібно {n} оракулів — поповни в магазині',
    en: 'This month’s free big report is used. You need {n} oracles — top up in the shop',
  },
  premiumHint: { ru: 'С Premium — бесплатно', uk: 'З Premium — безкоштовно', en: 'Free with Premium' },
  start: { ru: 'Начать расклад', uk: 'Почати розклад', en: 'Start reading' },
};

export default function SpreadScreen() {
  const {
    selectedSpread, locale, setScreen, goBack, setCurrentReading,
    setGenerating, addToHistory, user, spendMana, setManaModal, patchUser,
  } = useAppStore();
  const l = (locale || 'ru') as L;
  // Birth date saved in the profile (moon widget) pre-fills date-based spreads
  const [question, setQuestion] = useState(() =>
    selectedSpread?.requiresInput === 'date' && user?.birthDate ? user.birthDate : '',
  );
  const [partnerName, setPartnerName] = useState('');
  const [partnerSign, setPartnerSign] = useState('');
  const [dreamText, setDreamText] = useState('');
  const [birthDate, setBirthDate] = useState(() => user?.birthDate || '');
  const [birthTime, setBirthTime] = useState('');
  const [birthCity, setBirthCity] = useState('');
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
  const price = effectivePrice(spread, user);

  const canStart = () => {
    switch (spread.requiresInput) {
      case 'none': return true;
      case 'question': return question.trim().length > 2;
      case 'name': return question.trim().length > 0;
      case 'dream_text': return dreamText.trim().length > 10;
      case 'number': return question.trim().length > 0;
      case 'date': return question.trim().length > 0;
      case 'two_people': return partnerName.trim().length > 0;
      case 'natal_data': return birthDate.length > 0 && birthTime.trim().length >= 4 && birthCity.trim().length > 1;
      default: return true;
    }
  };

  const startReading = async () => {
    // Premium-only spread without premium → shop
    if (price.kind === 'premium_only') {
      setScreen('shop');
      return;
    }
    // Check mana client-side (UI guard only; server deducts the actual mana).
    // Premium and the first free reading cost 0 here, so they are not blocked.
    if (price.cost > 0 && (user?.mana ?? 0) < price.cost) {
      // The mana modal is hidden for premium; premium only pays here for a
      // second big report in the same month, so say that plainly instead
      if (user?.isPremium) {
        setError(T.bigUsed[l].replace('{n}', String(price.cost)));
        return;
      }
      setManaModal(true, price.cost);
      return;
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
        birthDate: birthDate || undefined,
        birthTime: birthTime || undefined,
        birthCity: birthCity || undefined,
        locale: l,
      };

      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        // Premium-only spread
        setError(T.premiumOnly[l]);
        setIsStarting(false);
        setGenerating(false);
        setScreen('shop');
        return;
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
      } else if (price.cost > 0) {
        // If server didn't return newMana, deduct client-side as fallback
        spendMana(price.cost);
      }
      if (data.accessReason === 'first_free') patchUser({ firstReadingFree: false });
      // New cards show up in the Grimoire right away, not after a restart
      if (Array.isArray(data.newCardsUnlocked) && user) {
        patchUser({ cardCollection: Array.from(new Set([...user.cardCollection, ...data.newCardsUnlocked])) });
      }
      if (data.premiumSaved !== undefined) patchUser({ premiumSaved: data.premiumSaved });
      if (price.kind === 'premium_big') patchUser({ premiumBigReportAvailable: false });

      const reading = {
        id: data.id,
        spreadId: spread.id,
        cards: data.cards || [],
        interpretation: data.interpretation,
        createdAt: new Date().toISOString(),
        question: question || undefined,
        generatedImage: data.generatedImage || undefined,
        natalChartData: data.natalChartData || undefined,
        matrixDate: data.matrixDate || undefined,
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

  // Full-screen loading for natal chart (takes 20-40s)
  if (isStarting && (spread.id === 'natal_chart' || spread.id === 'destiny_matrix')) {
    return <NatalLoadingScreen locale={l} />;
  }

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
          {spread.id === 'horoscope' ? ` (${formatTodayShort()})` : ''}
        </h1>
        <p className="text-mystic-muted text-sm mt-2 max-w-xs mx-auto">{spread.description[l]}</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          {spread.cardCount > 0 && (
            <span className="text-[11px] bg-mystic-card px-2.5 py-1 rounded-full text-mystic-muted border border-mystic-accent/20">
              🃏 {cardsLabel(spread.cardCount, l)}
            </span>
          )}
          <span className={`text-[11px] bg-mystic-card px-2.5 py-1 rounded-full border flex items-center gap-1 ${
            user?.isPremium ? 'text-mystic-gold border-mystic-gold/30' : 'text-mystic-muted border-mystic-accent/20'
          }`}>
            <PriceTag price={price} locale={l} />
          </span>
        </div>
      </motion.div>

      {spread.positions && spread.positions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="mb-6 bg-mystic-card/60 rounded-xl p-4 border border-mystic-accent/10 aura-mystic">
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
        {spread.requiresInput === 'natal_data' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.natalDateLbl[l]}</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.natalTimeLbl[l]}</label>
              <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} placeholder={T.natalTimePh[l]} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-mystic-muted uppercase tracking-wider mb-2 block">{T.natalCityLbl[l]}</label>
              <input value={birthCity} onChange={(e) => setBirthCity(e.target.value)} placeholder={T.natalCityPh[l]} className={inputClass} />
            </div>
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
              {price.kind !== 'free' && <span className="flex items-center gap-1 text-sm opacity-90">• <PriceTag price={price} locale={l} size="md" compact /></span>}
            </span>
          )}
        </motion.button>
        {price.kind === 'mana' && !user?.isPremium && (
          <button onClick={() => setScreen('shop')} className="mt-2 w-full text-center text-[11px] text-mystic-gold/80">
            👑 {T.premiumHint[l]}
          </button>
        )}
    </div>
  );
}
