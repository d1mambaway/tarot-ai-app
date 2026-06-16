'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';
import ManaIcon from './ManaIcon';

/**
 * Modal shown when user doesn't have enough mana.
 * Offers: subscribe to channel (+1000), buy mana packs, or dismiss.
 */
export default function ManaModal() {
  const { showManaModal, manaNeeded, user, locale, setManaModal, setChannelSubscribed, addMana, setScreen } = useAppStore();
  const l = locale || 'ru';
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  if (!showManaModal) return null;

  const currentMana = user?.mana ?? 0;
  const deficit = Math.max(0, manaNeeded - currentMana);
  const canClaimChannel = !user?.channelSubscribed;

  const handleSubscribeCheck = async () => {
    setChecking(true);
    setCheckError('');

    try {
      // Open channel in Telegram first
      const tg = (window as any).Telegram?.WebApp;

      const res = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user?.telegramId }),
      });

      const data = await res.json();

      if (data.subscribed) {
        setChannelSubscribed();
        setCheckError('');
        // If now have enough mana, close modal
        if (currentMana + 1000 >= manaNeeded) {
          setTimeout(() => setManaModal(false), 800);
        }
      } else {
        setCheckError(
          l === 'uk'
            ? 'Ви ще не підписані. Підпишіться і натисніть знову!'
            : 'Вы ещё не подписаны. Подпишитесь и нажмите снова!'
        );
      }
    } catch {
      setCheckError(l === 'uk' ? 'Помилка перевірки' : 'Ошибка проверки');
    } finally {
      setChecking(false);
    }
  };

  const openChannel = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink('https://t.me/cardsofmagic');
    } else {
      window.open('https://t.me/cardsofmagic', '_blank');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={() => setManaModal(false)}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-mystic-card rounded-3xl border border-mystic-accent/30 p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-5">
            <div className="mb-3">
              <ManaIcon size="lg" className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold font-mystic text-mystic-text">
              {l === 'uk' ? 'Не вистачає мани' : 'Не хватает маны'}
            </h2>
            <p className="text-sm text-mystic-muted mt-1">
              {l === 'uk'
                ? `Потрібно ${manaNeeded}, у вас ${currentMana}`
                : `Нужно ${manaNeeded}, у вас ${currentMana}`}
            </p>
          </div>

          {/* Subscribe to channel bonus */}
          {canClaimChannel && (
            <div className="bg-gradient-to-br from-mystic-purple/20 to-mystic-blue/20 rounded-2xl p-4 border border-mystic-accent/20 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎁</span>
                <span className="font-bold text-mystic-accent text-sm">
                  +1000 {l === 'uk' ? 'мани безкоштовно!' : 'маны бесплатно!'}
                </span>
              </div>
              <p className="text-xs text-mystic-muted mb-3">
                {l === 'uk'
                  ? 'Підпишіться на наш канал і отримайте бонус'
                  : 'Подпишитесь на наш канал и получите бонус'}
              </p>

              {/* Step 1: Open channel */}
              <button
                onClick={openChannel}
                className="w-full py-2.5 rounded-xl bg-[#2AABEE] text-white font-bold text-sm mb-2 flex items-center justify-center gap-2"
              >
                📢 {l === 'uk' ? 'Підписатися на канал' : 'Подписаться на канал'}
              </button>

              {/* Step 2: Check */}
              <button
                onClick={handleSubscribeCheck}
                disabled={checking}
                className="w-full py-2.5 rounded-xl bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent font-bold text-sm flex items-center justify-center gap-2"
              >
                {checking ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>✅ {l === 'uk' ? 'Я підписався — перевірити' : 'Я подписался — проверить'}</>
                )}
              </button>

              {checkError && (
                <p className="text-xs text-mystic-danger mt-2 text-center">{checkError}</p>
              )}

              {/* Success message */}
              {user?.channelSubscribed && (
                <p className="text-xs text-green-400 mt-2 text-center font-bold">
                  ✅ +1000 {l === 'uk' ? 'мани нараховано!' : 'маны начислено!'}
                </p>
              )}
            </div>
          )}

          {/* Buy mana button */}
          <button
            onClick={() => {
              setManaModal(false);
              setScreen('shop');
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-gold text-mystic-bg font-bold text-sm mb-3"
          >
            <span className="flex items-center justify-center gap-2">
              <ManaIcon size="sm" />
              {l === 'uk' ? 'Купити ману за ⭐ Stars' : 'Купить ману за ⭐ Stars'}
            </span>
          </button>

          {/* Close */}
          <button
            onClick={() => setManaModal(false)}
            className="w-full py-2.5 text-mystic-muted text-sm"
          >
            {l === 'uk' ? 'Пізніше' : 'Позже'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
