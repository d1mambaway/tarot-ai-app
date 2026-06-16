'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';
import ManaIcon from './ManaIcon';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Не хватает маны', uk: 'Не вистачає мани', en: 'Not enough mana' },
  need: { ru: 'Нужно', uk: 'Потрібно', en: 'Need' },
  have: { ru: 'у вас', uk: 'у вас', en: 'you have' },
  freeBonus: { ru: 'маны бесплатно!', uk: 'мани безкоштовно!', en: 'mana for free!' },
  subChannel: { ru: 'Подпишитесь на наш канал и получите бонус', uk: 'Підпишіться на наш канал і отримайте бонус', en: 'Subscribe to our channel and get a bonus' },
  subBtn: { ru: 'Подписаться на канал', uk: 'Підписатися на канал', en: 'Subscribe to channel' },
  checkBtn: { ru: 'Я подписался — проверить', uk: 'Я підписався — перевірити', en: 'I subscribed — verify' },
  notSub: { ru: 'Вы ещё не подписаны. Подпишитесь и нажмите снова!', uk: 'Ви ще не підписані. Підпишіться і натисніть знову!', en: 'Not subscribed yet. Subscribe and try again!' },
  checkErr: { ru: 'Ошибка проверки', uk: 'Помилка перевірки', en: 'Verification error' },
  credited: { ru: 'маны начислено!', uk: 'мани нараховано!', en: 'mana credited!' },
  buyBtn: { ru: 'Купить ману за ⭐ Stars', uk: 'Купити ману за ⭐ Stars', en: 'Buy mana with ⭐ Stars' },
  later: { ru: 'Позже', uk: 'Пізніше', en: 'Later' },
};

export default function ManaModal() {
  const { showManaModal, manaNeeded, user, locale, setManaModal, setChannelSubscribed, addMana, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  if (!showManaModal) return null;

  const currentMana = user?.mana ?? 0;
  const canClaimChannel = !user?.channelSubscribed;

  const handleSubscribeCheck = async () => {
    setChecking(true);
    setCheckError('');
    try {
      const res = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user?.telegramId }),
      });
      const data = await res.json();
      if (data.subscribed) {
        setChannelSubscribed();
        setCheckError('');
        if (currentMana + 1000 >= manaNeeded) {
          setTimeout(() => setManaModal(false), 800);
        }
      } else {
        setCheckError(T.notSub[l]);
      }
    } catch {
      setCheckError(T.checkErr[l]);
    } finally {
      setChecking(false);
    }
  };

  const openChannel = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) tg.openTelegramLink('https://t.me/cardsofmagic');
    else window.open('https://t.me/cardsofmagic', '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={() => setManaModal(false)}>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-mystic-card rounded-3xl border border-mystic-accent/30 p-6 shadow-2xl">

          <div className="text-center mb-5">
            <div className="mb-3"><ManaIcon size="lg" className="mx-auto" /></div>
            <h2 className="text-xl font-bold font-mystic text-mystic-text">{T.title[l]}</h2>
            <p className="text-sm text-mystic-muted mt-1">
              {T.need[l]} {manaNeeded}, {T.have[l]} {currentMana}
            </p>
          </div>

          {canClaimChannel && (
            <div className="bg-gradient-to-br from-mystic-purple/20 to-mystic-blue/20 rounded-2xl p-4 border border-mystic-accent/20 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎁</span>
                <span className="font-bold text-mystic-accent text-sm">+1000 {T.freeBonus[l]}</span>
              </div>
              <p className="text-xs text-mystic-muted mb-3">{T.subChannel[l]}</p>
              <button onClick={openChannel}
                className="w-full py-2.5 rounded-xl bg-[#2AABEE] text-white font-bold text-sm mb-2 flex items-center justify-center gap-2">
                📢 {T.subBtn[l]}
              </button>
              <button onClick={handleSubscribeCheck} disabled={checking}
                className="w-full py-2.5 rounded-xl bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent font-bold text-sm flex items-center justify-center gap-2">
                {checking ? <span className="animate-spin">⏳</span> : <>✅ {T.checkBtn[l]}</>}
              </button>
              {checkError && <p className="text-xs text-mystic-danger mt-2 text-center">{checkError}</p>}
              {user?.channelSubscribed && (
                <p className="text-xs text-green-400 mt-2 text-center font-bold">✅ +1000 {T.credited[l]}</p>
              )}
            </div>
          )}

          <button onClick={() => { setManaModal(false); setScreen('shop'); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-gold text-mystic-bg font-bold text-sm mb-3">
            <span className="flex items-center justify-center gap-2">
              <ManaIcon size="sm" /> {T.buyBtn[l]}
            </span>
          </button>

          <button onClick={() => setManaModal(false)} className="w-full py-2.5 text-mystic-muted text-sm">
            {T.later[l]}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
