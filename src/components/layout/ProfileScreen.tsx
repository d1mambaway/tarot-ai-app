'use client';

import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';

export default function ProfileScreen() {
  const { user, locale, readingHistory, setScreen } = useAppStore();
  const l = locale || 'ru';

  const subLabels: Record<string, string> = {
    none: l === 'uk' ? 'Безкоштовний' : 'Бесплатный',
    BASIC: 'Basic ⭐',
    PREMIUM: 'Premium 💎',
    VIP: 'VIP 👑',
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">
        👤 {l === 'uk' ? 'Профіль' : 'Профиль'}
      </h1>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-mystic-card/80 rounded-2xl p-5 border border-mystic-accent/20 mb-4"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-mystic-purple to-mystic-accent flex items-center justify-center text-2xl font-bold text-mystic-bg">
            {user?.firstName?.[0] || '?'}
          </div>
          <div>
            <p className="font-bold text-lg text-mystic-text">{user?.firstName || 'Гость'}</p>
            <p className="text-xs text-mystic-accent">{subLabels[user?.subscription || 'none']}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent flex items-center justify-center gap-1">
              <ManaIcon size="sm" /> {user?.mana ?? 0}
            </p>
            <p className="text-[10px] text-mystic-muted">{l === 'uk' ? 'Мана' : 'Мана'}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.streakDays || 0}</p>
            <p className="text-[10px] text-mystic-muted">🔥 {l === 'uk' ? 'Серія' : 'Серия'}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{readingHistory.length}</p>
            <p className="text-[10px] text-mystic-muted">🔮 {l === 'uk' ? 'Розкл.' : 'Раскл.'}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.cardCollection?.length || 0}</p>
            <p className="text-[10px] text-mystic-muted">🃏 {l === 'uk' ? 'Карти' : 'Карты'}</p>
          </div>
        </div>
      </motion.div>

      {/* Mana section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-mystic-blue/20 to-mystic-purple/20 rounded-2xl p-4 border border-mystic-accent/20 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-mystic-text flex items-center gap-2">
            <ManaIcon size="md" /> {l === 'uk' ? 'Мана' : 'Мана'}
          </h2>
          <button
            onClick={() => setScreen('shop')}
            className="text-xs text-mystic-accent font-bold px-3 py-1 rounded-full bg-mystic-accent/10 border border-mystic-accent/20"
          >
            + {l === 'uk' ? 'Поповнити' : 'Пополнить'}
          </button>
        </div>
        <p className="text-3xl font-bold text-mystic-accent mb-1">{user?.mana ?? 0}</p>
        <p className="text-xs text-mystic-muted">
          {l === 'uk'
            ? 'Мана витрачається на розклади та читання'
            : 'Мана тратится на расклады и чтения'}
        </p>
      </motion.div>

      {/* Referral */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-mystic-purple/20 to-mystic-blue/20 rounded-2xl p-4 border border-mystic-accent/20"
      >
        <h2 className="text-sm font-bold text-mystic-accent mb-1">
          🎉 {l === 'uk' ? 'Запроси друга' : 'Пригласи друга'}
        </h2>
        <p className="text-[11px] text-mystic-muted mb-3">
          {l === 'uk'
            ? 'Отримай 200 мани за кожного друга!'
            : 'Получи 200 маны за каждого друга!'}
        </p>
        <button
          onClick={() => {
            const tg = (window as any).Telegram?.WebApp;
            if (tg) {
              const botUsername = 'cardsofmagic_bot';
              const refLink = `https://t.me/${botUsername}?start=ref_${user?.telegramId || ''}`;
              tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🔮 Магия Карт — AI таролог в Telegram!')}`);
            }
          }}
          className="w-full py-2.5 rounded-xl bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent text-sm font-bold"
        >
          📤 {l === 'uk' ? 'Поділитися' : 'Поделиться'}
        </button>
      </motion.div>
    </div>
  );
}
