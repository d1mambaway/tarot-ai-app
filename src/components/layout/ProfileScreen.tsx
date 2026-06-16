'use client';

import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Профиль', uk: 'Профіль', en: 'Profile' },
  oracles: { ru: 'Оракулы', uk: 'Оракули', en: 'Oracles' },
  streak: { ru: 'Серия', uk: 'Серія', en: 'Streak' },
  readings: { ru: 'Раскл.', uk: 'Розкл.', en: 'Reads' },
  cards: { ru: 'Карты', uk: 'Карти', en: 'Cards' },
  topUp: { ru: 'Пополнить', uk: 'Поповнити', en: 'Top up' },
  oraclesDesc: { ru: 'Оракулы тратятся на расклады и чтения', uk: 'Оракули витрачаються на розклади та читання', en: 'Oracles are spent on spreads and readings' },
  freeOracles: { ru: 'Бесплатные оракулы', uk: 'Безкоштовні оракули', en: 'Free oracles' },
  dailyCheckIn: { ru: 'Ежедневный вход', uk: 'Щоденний вхід', en: 'Daily check-in' },
  channelSub: { ru: 'Подписка на канал', uk: 'Підписка на канал', en: 'Channel subscription' },
  invite: { ru: 'Пригласи друга', uk: 'Запроси друга', en: 'Invite a friend' },
  inviteDesc: { ru: 'Получи 500 оракулов за каждого друга!', uk: 'Отримай 500 оракулів за кожного друга!', en: 'Get 500 oracles per friend!' },
  perFriend: { ru: 'За каждого друга', uk: 'За кожного друга', en: 'Per friend' },
  invited: { ru: 'Приглашено друзей', uk: 'Запрошено друзів', en: 'Friends invited' },
  share: { ru: 'Поделиться', uk: 'Поділитися', en: 'Share' },
  free: { ru: 'Бесплатный', uk: 'Безкоштовний', en: 'Free' },
};

// Daily check-in rewards: days 1-6 = 50, day 7 = 300
const CHECKIN_DAYS = [50, 50, 50, 50, 50, 50, 300];

export default function ProfileScreen() {
  const { user, locale, readingHistory, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;

  const subLabels: Record<string, string> = {
    none: T.free[l],
    BASIC: 'Basic ⭐',
    PREMIUM: 'Premium 💎',
    VIP: 'VIP 👑',
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">👤 {T.title[l]}</h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-mystic-card/80 rounded-2xl p-5 border border-mystic-accent/20 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-mystic-purple to-mystic-accent flex items-center justify-center text-2xl font-bold text-mystic-bg">
            {user?.firstName?.[0] || '?'}
          </div>
          <div>
            <p className="font-bold text-lg text-mystic-text">{user?.firstName || 'Guest'}</p>
            <p className="text-xs text-mystic-accent">{subLabels[user?.subscription || 'none']}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent flex items-center justify-center gap-1">
              <ManaIcon size="sm" /> {user?.mana ?? 0}
            </p>
            <p className="text-[10px] text-mystic-muted">{T.oracles[l]}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.streakDays || 0}</p>
            <p className="text-[10px] text-mystic-muted">🔥 {T.streak[l]}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{readingHistory.length}</p>
            <p className="text-[10px] text-mystic-muted">🔮 {T.readings[l]}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.cardCollection?.length || 0}</p>
            <p className="text-[10px] text-mystic-muted">🃏 {T.cards[l]}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-mystic-blue/20 to-mystic-purple/20 rounded-2xl p-4 border border-mystic-accent/20 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-mystic-text flex items-center gap-2"><ManaIcon size="md" /> {T.oracles[l]}</h2>
          <button onClick={() => setScreen('shop')}
            className="text-xs text-mystic-accent font-bold px-3 py-1 rounded-full bg-mystic-accent/10 border border-mystic-accent/20">
            + {T.topUp[l]}
          </button>
        </div>
        <p className="text-3xl font-bold text-mystic-accent mb-1">{user?.mana ?? 0}</p>
        <p className="text-xs text-mystic-muted">{T.oraclesDesc[l]}</p>
      </motion.div>

      {/* Free Oracles Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-mystic-card/80 rounded-2xl p-4 border border-mystic-accent/20 mb-4">
        <h2 className="text-sm font-bold text-mystic-text mb-3">🎁 {T.freeOracles[l]}</h2>
        <div className="space-y-2">
          {/* Daily Check-in */}
          <div className="bg-mystic-bg/30 rounded-xl p-3 border border-mystic-accent/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-mystic-text">🔥 {T.dailyCheckIn[l]}</p>
              <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                +50/+300 <ManaIcon size="sm" />
              </span>
            </div>
            <div className="flex gap-1">
              {CHECKIN_DAYS.map((reward, i) => {
                const dayNum = i + 1;
                const streakDays = user?.streakDays ?? 0;
                const isCompleted = dayNum <= streakDays;
                const isCurrent = dayNum === streakDays;
                return (
                  <div key={i} className={`flex-1 rounded-lg p-1.5 text-center border ${
                    isCompleted
                      ? 'bg-mystic-accent/20 border-mystic-accent/40'
                      : 'bg-mystic-bg/30 border-mystic-accent/10'
                  } ${isCurrent ? 'ring-1 ring-mystic-accent' : ''}`}>
                    <p className="text-[9px] text-mystic-muted">{dayNum}</p>
                    <p className={`text-[10px] font-bold ${isCompleted ? 'text-green-400' : 'text-mystic-muted'}`}>
                      {reward === 300 ? '🎁' : `+${reward}`}
                    </p>
                    {isCompleted && <p className="text-[8px]">✅</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Channel subscription */}
          {!user?.channelSubscribed && (
            <div className="flex items-center justify-between bg-mystic-bg/30 rounded-xl p-3 border border-mystic-accent/10">
              <div>
                <p className="text-sm text-mystic-text">📢 {T.channelSub[l]}</p>
                <p className="text-xs text-mystic-muted">@cardsofmagic</p>
              </div>
              <span className="text-sm font-bold text-green-400 flex items-center gap-1">+1000 <ManaIcon size="sm" /></span>
            </div>
          )}

          {/* Invite friend */}
          <div className="flex items-center justify-between bg-mystic-bg/30 rounded-xl p-3 border border-mystic-accent/10">
            <div>
              <p className="text-sm text-mystic-text">🎉 {T.invite[l]}</p>
              <p className="text-xs text-mystic-muted">{T.perFriend[l]}</p>
            </div>
            <span className="text-sm font-bold text-green-400 flex items-center gap-1">+500 <ManaIcon size="sm" /></span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-mystic-purple/20 to-mystic-blue/20 rounded-2xl p-4 border border-mystic-accent/20">
        <h2 className="text-sm font-bold text-mystic-accent mb-1">🎉 {T.invite[l]}</h2>
        <p className="text-[11px] text-mystic-muted mb-1">{T.inviteDesc[l]}</p>
        {(user?.referralCount ?? 0) > 0 && (
          <p className="text-xs text-green-400 font-bold mb-2">
            ✅ {T.invited[l]}: {user?.referralCount}
          </p>
        )}
        <button onClick={() => {
          const tg = (window as any).Telegram?.WebApp;
          if (tg) {
            const refLink = `https://t.me/cardsofmagic_bot?start=ref_${user?.telegramId || ''}`;
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🔮 Магия Карт — AI таролог в Telegram!')}`);
          }
        }}
          className="w-full py-2.5 rounded-xl bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent text-sm font-bold mt-2">
          📤 {T.share[l]}
        </button>
      </motion.div>
    </div>
  );
}
