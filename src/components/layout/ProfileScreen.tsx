'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import AchievementsSection from '@/components/ui/AchievementsSection';
import ProfileSetupModal from '@/components/ui/ProfileSetupModal';

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
  history: { ru: 'История раскладов', uk: 'Історія розкладів', en: 'Reading History' },
  historyDesc: { ru: 'Все ваши прошлые чтения', uk: 'Всі ваші минулі читання', en: 'All your past readings' },
  premiumActive: { ru: 'Премиум активен', uk: 'Преміум активний', en: 'Premium active' },
  premiumExpires: { ru: 'Действует до', uk: 'Діє до', en: 'Active until' },
  premiumDaysLeft: { ru: 'Осталось дней', uk: 'Залишилось днів', en: 'Days left' },
  premiumUnlimited: { ru: 'Безлимит ∞', uk: 'Безлімітно ∞', en: 'Unlimited ∞' },
  getPremium: { ru: 'Получить Премиум', uk: 'Отримати Преміум', en: 'Get Premium' },
  personalization: { ru: 'Имя и пол', uk: "Ім'я та стать", en: 'Name & gender' },
  personalizationDesc: {
    ru: 'Оракул обращается к тебе в правильном роде',
    uk: 'Оракул звертається до тебе у правильному роді',
    en: 'The Oracle addresses you correctly',
  },
  genderFemale: { ru: 'Женский', uk: 'Жіноча', en: 'Female' },
  genderMale: { ru: 'Мужской', uk: 'Чоловіча', en: 'Male' },
  genderNeutral: { ru: 'Не указан', uk: 'Не вказано', en: 'Not specified' },
};

// Daily check-in rewards: days 1-6 = 50, day 7 = 300
const CHECKIN_DAYS = [50, 50, 50, 50, 50, 50, 300];


// ─── Reading Statistics ─────────────────────────────────────────────────────

function ReadingStats({ readings, l }: { readings: any[]; l: L }) {
  if (readings.length === 0) return null;
  
  const suitCounts: Record<string, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  let reversedCount = 0;
  let totalCards = 0;
  
  readings.forEach((r: any) => {
    (r.cards || []).forEach((card: any) => {
      totalCards++;
      if (card.reversed) reversedCount++;
      const id = card.id ?? 0;
      if (id >= 22 && id <= 35) suitCounts.wands++;
      else if (id >= 36 && id <= 49) suitCounts.cups++;
      else if (id >= 50 && id <= 63) suitCounts.swords++;
      else if (id >= 64) suitCounts.pentacles++;
    });
  });
  
  const topSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];
  const reversedPct = totalCards > 0 ? Math.round((reversedCount / totalCards) * 100) : 0;
  
  const suitIcons: Record<string, string> = { wands: '🪄', cups: '🏆', swords: '⚔️', pentacles: '⭐' };
  const suitNames: Record<string, Record<string, string>> = {
    wands: { ru: 'Жезлы', uk: 'Жезли', en: 'Wands' },
    cups: { ru: 'Кубки', uk: 'Кубки', en: 'Cups' },
    swords: { ru: 'Мечи', uk: 'Мечі', en: 'Swords' },
    pentacles: { ru: 'Пентакли', uk: 'Пентаклі', en: 'Pentacles' },
  };
  
  const sL = {
    title: { ru: 'Статистика', uk: 'Статистика', en: 'Statistics' },
    topSuit: { ru: 'Любимая масть', uk: 'Улюблена масть', en: 'Top Suit' },
    reversed: { ru: 'Перевёрнутых', uk: 'Перевернутих', en: 'Reversed' },
    totalCards: { ru: 'Всего карт', uk: 'Усього карт', en: 'Total Cards' },
  };
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="bg-mystic-card/80 rounded-2xl p-4 border border-mystic-accent/20 mb-4 aura-accent">
      <h3 className="text-sm font-bold text-mystic-accent font-mystic mb-3">📊 {sL.title[l]}</h3>
      <div className="grid grid-cols-3 gap-2">
        {topSuit && topSuit[1] > 0 && (
          <div className="bg-mystic-bg/50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-mystic-muted mb-1">{sL.topSuit[l]}</p>
            <p className="text-xs font-bold text-mystic-accent">{suitIcons[topSuit[0]]} {suitNames[topSuit[0]]?.[l]}</p>
          </div>
        )}
        <div className="bg-mystic-bg/50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-mystic-muted mb-1">{sL.reversed[l]}</p>
          <p className="text-xs font-bold text-mystic-accent">↩️ {reversedPct}%</p>
        </div>
        <div className="bg-mystic-bg/50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-mystic-muted mb-1">{sL.totalCards[l]}</p>
          <p className="text-xs font-bold text-mystic-accent">🃏 {totalCards}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProfileScreen() {
  const { user, locale, readingHistory, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const genderLabel =
    user?.gender === 'female' ? T.genderFemale[l] : user?.gender === 'male' ? T.genderMale[l] : T.genderNeutral[l];
  const isPremium = user?.isPremium ?? false;

  const subLabels: Record<string, string> = {
    none: T.free[l],
    BASIC: 'Basic ⭐',
    PREMIUM: '👑 Premium',
    VIP: '👑 VIP',
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(l === 'uk' ? 'uk-UA' : l === 'en' ? 'en-US' : 'ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">👤 {T.title[l]}</h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 mb-4 ${
          isPremium
            ? 'bg-gradient-to-br from-mystic-gold/10 via-mystic-card/80 to-mystic-accent/10 border border-mystic-gold/30 aura-gold'
            : 'bg-mystic-card/80 border border-mystic-accent/20 aura-accent'
        }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-mystic-bg ${
            isPremium
              ? 'bg-gradient-to-br from-mystic-gold to-mystic-accent ring-2 ring-mystic-gold/50'
              : 'bg-gradient-to-br from-mystic-purple to-mystic-accent'
          }`}>
            {user?.firstName?.[0] || '?'}
          </div>
          <div>
            <p className="font-bold text-lg text-mystic-text flex items-center gap-1.5">
              {user?.firstName || 'Guest'}
              {isPremium && <span className="text-base">👑</span>}
            </p>
            <p className={`text-xs ${isPremium ? 'text-mystic-gold font-bold' : 'text-mystic-accent'}`}>
              {subLabels[user?.subscription || 'none']}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent flex items-center justify-center gap-1">
              {isPremium ? (
                <span className="text-mystic-gold">∞</span>
              ) : (
                <><ManaIcon size="sm" /> {user?.mana ?? 0}</>
              )}
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

      {/* Personalization — name + grammatical gender */}
      <motion.button
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        onClick={() => setShowProfileSetup(true)}
        className="w-full text-left rounded-2xl p-4 mb-4 bg-mystic-card/80 border border-mystic-accent/20 aura-accent flex items-center justify-between gap-3"
      >
        <div>
          <p className="text-sm font-bold text-mystic-accent font-mystic">✨ {T.personalization[l]}</p>
          <p className="text-[11px] text-mystic-muted mt-0.5">{T.personalizationDesc[l]}</p>
        </div>
        <span className="text-xs text-mystic-text whitespace-nowrap">
          {(user?.displayName || user?.firstName || '—')} · {genderLabel} ›
        </span>
      </motion.button>

      {/* Premium Status Card */}
      {isPremium ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl p-4 mb-4 bg-gradient-to-br from-mystic-gold/15 to-mystic-accent/10 border border-mystic-gold/30 aura-gold">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👑</span>
            <div>
              <p className="font-bold text-mystic-gold text-sm">{T.premiumActive[l]}</p>
              {user?.premiumExpiresAt && (
                <p className="text-xs text-mystic-muted">
                  {T.premiumExpires[l]}: {formatDate(user.premiumExpiresAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between bg-mystic-bg/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <ManaIcon size="sm" />
              <span className="text-sm text-mystic-text">{T.premiumUnlimited[l]}</span>
            </div>
            {user?.premiumDaysLeft !== undefined && (
              <span className="text-xs text-mystic-gold font-bold">
                {T.premiumDaysLeft[l]}: {user.premiumDaysLeft}
              </span>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => setScreen('shop')}
          className="w-full rounded-2xl p-4 mb-4 bg-gradient-to-r from-mystic-gold/15 to-mystic-accent/10
                     border border-mystic-gold/20 flex items-center gap-4
                     active:scale-[0.98] transition-transform text-left hover:border-mystic-gold/40 aura-gold"
        >
          <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-mystic-gold/20 to-mystic-accent/10
                           border border-mystic-gold/20 flex items-center justify-center text-2xl shrink-0">
            👑
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-mystic-gold">{T.getPremium[l]}</p>
            <p className="text-xs text-mystic-muted">{T.premiumUnlimited[l]}</p>
          </div>
          <span className="text-mystic-gold text-lg">›</span>
        </motion.button>
      )}

      {/* History Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => setScreen('history')}
        className="w-full bg-mystic-card/80 rounded-2xl p-4 border border-mystic-accent/20 mb-4 aura-mystic
                   flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
      >
        <span className="w-12 h-12 rounded-xl bg-mystic-accent/10 border border-mystic-accent/20
                         flex items-center justify-center text-2xl shrink-0">
          📜
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-mystic-text">{T.history[l]}</p>
          <p className="text-xs text-mystic-muted">{T.historyDesc[l]}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span className="text-lg font-bold text-mystic-accent">{readingHistory.length}</span>
          <span className="text-mystic-muted text-lg">›</span>
        </div>
      </motion.button>

      {/* Statistics */}
      <ReadingStats readings={readingHistory} l={l} />

      {/* Achievements */}
      <ProfileSetupModal open={showProfileSetup} onClose={() => setShowProfileSetup(false)} />

      <AchievementsSection
        readingsCount={readingHistory.length}
        cardsCollected={user?.cardCollection || []}
        streakDays={user?.streakDays || 0}
        locale={l}
      />


      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-mystic-blue/20 to-mystic-purple/20 rounded-2xl p-4 border border-mystic-accent/20 mb-4 aura-blue">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-mystic-text flex items-center gap-2"><ManaIcon size="md" /> {T.oracles[l]}</h2>
          <button onClick={() => setScreen('shop')}
            className="text-xs text-mystic-accent font-bold px-3 py-1 rounded-full bg-mystic-accent/10 border border-mystic-accent/20">
            + {T.topUp[l]}
          </button>
        </div>
        <p className={`text-3xl font-bold mb-1 ${isPremium ? 'text-mystic-gold' : 'text-mystic-accent'}`}>
          {isPremium ? '∞' : (user?.mana ?? 0)}
        </p>
        <p className="text-xs text-mystic-muted">{T.oraclesDesc[l]}</p>
      </motion.div>

      {/* Free Oracles Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-mystic-card/80 rounded-2xl p-4 border border-mystic-accent/20 mb-4 aura-accent">
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-gradient-to-br from-mystic-purple/20 to-mystic-blue/20 rounded-2xl p-4 border border-mystic-accent/20 aura-purple">
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
