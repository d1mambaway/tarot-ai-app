'use client';

import AppAccountCard from '@/components/ui/AppAccountCard';
import { useAppMode } from '@/lib/app-mode';
import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import AchievementsSection from '@/components/ui/AchievementsSection';
import ProfileSetupModal from '@/components/ui/ProfileSetupModal';
import { daysLabel } from '@/lib/plural';
import { Icon, IconBadge } from '@/components/ui/Icon';
import { ChartNoAxesColumn, Cake, Check, ChevronRight, Crown, Flame, Gem, Gift, Globe, Layers, Megaphone, Orbit, ScrollText, Send, Sparkles, User, UserPlus, VenusAndMars } from 'lucide-react';
import BirthDateCard from '@/components/ui/moon/BirthDateCard';
import { SIGN_KEYS, SIGN_GLYPHS, SIGN_NAMES } from '@/lib/zodiac';

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
  premiumExpires: { ru: 'до', uk: 'до', en: 'until' },
  premiumDaysLeft: { ru: 'Осталось дней', uk: 'Залишилось днів', en: 'Days left' },
  premiumUnlimited: { ru: 'Любой расклад — за 0 оракулов', uk: 'Будь-який розклад — за 0 оракулів', en: 'Every reading for 0 oracles' },
  shareText: {
    ru: '🔮 Магия Карт — таро, руны и гороскоп прямо в Telegram',
    uk: '🔮 Магія Карт — таро, руни та гороскоп просто в Telegram',
    en: '🔮 Magic of Cards — tarot, runes and horoscopes right in Telegram',
  },
  premiumSaved: { ru: 'Сэкономлено оракулов', uk: 'Заощаджено оракулів', en: 'Oracles saved' },
  bigReportYes: { ru: 'Натальная карта или Матрица в этом месяце — бесплатно', uk: 'Натальна карта або Матриця цього місяця — безкоштовно', en: 'Natal chart or Matrix this month — free' },
  bigReportNo: { ru: 'Бесплатный большой отчёт этого месяца уже использован', uk: 'Безкоштовний великий звіт цього місяця вже використано', en: 'This month’s free big report is used' },
  getPremium: { ru: 'Получить Премиум', uk: 'Отримати Преміум', en: 'Get Premium' },
  subscribe: { ru: 'Открыть канал', uk: 'Відкрити канал', en: 'Open channel' },
  checkSub: { ru: 'Я подписался', uk: 'Я підписався', en: 'I subscribed' },
  notSubYet: { ru: 'Подписка пока не видна — подпишись и нажми ещё раз', uk: 'Підписку ще не видно — підпишись і натисни ще раз', en: 'No subscription yet — subscribe and tap again' },
  myData: { ru: 'Мои данные', uk: 'Мої дані', en: 'My details' },
  rowName: { ru: 'Имя', uk: "Ім'я", en: 'Name' },
  rowGender: { ru: 'Пол', uk: 'Стать', en: 'Gender' },
  rowLang: { ru: 'Язык', uk: 'Мова', en: 'Language' },
  rowBirth: { ru: 'Дата рождения', uk: 'Дата народження', en: 'Birth date' },
  notSet: { ru: 'Указать', uk: 'Вказати', en: 'Add' },
  langName: { ru: 'Русский', uk: 'Українська', en: 'English' },
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
      <h3 className="t-section mb-3 flex items-center gap-2"><Icon icon={ChartNoAxesColumn} size={18} /> {sL.title[l]}</h3>
      <div className="grid grid-cols-3 gap-2">
        {topSuit && topSuit[1] > 0 && (
          <div className="bg-mystic-bg/50 rounded-xl p-2.5 text-center">
            <p className="text-micro text-mystic-muted mb-1">{sL.topSuit[l]}</p>
            <p className="text-sm font-bold text-mystic-accent">{suitNames[topSuit[0]]?.[l]}</p>
          </div>
        )}
        <div className="bg-mystic-bg/50 rounded-xl p-2.5 text-center">
          <p className="text-micro text-mystic-muted mb-1">{sL.reversed[l]}</p>
          <p className="text-sm font-bold text-mystic-accent">{reversedPct}%</p>
        </div>
        <div className="bg-mystic-bg/50 rounded-xl p-2.5 text-center">
          <p className="text-micro text-mystic-muted mb-1">{sL.totalCards[l]}</p>
          <p className="text-sm font-bold text-mystic-accent">{totalCards}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProfileScreen() {
  const { user, locale, readingHistory, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const appMode = useAppMode();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editBirth, setEditBirth] = useState(false);
  // Real total from the server; the loaded history is only the newest page
  const readingsTotal = Math.max(user?.readingsCount ?? 0, readingHistory.length);
  const [checking, setChecking] = useState(false);
  const [channelMsg, setChannelMsg] = useState('');
  const setChannelSubscribed = useAppStore((st) => st.setChannelSubscribed);

  const openChannel = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) tg.openTelegramLink('https://t.me/cardsofmagic');
    else window.open('https://t.me/cardsofmagic', '_blank');
  };
  const checkChannel = async () => {
    setChecking(true);
    setChannelMsg('');
    try {
      const res = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: (window as any).Telegram?.WebApp?.initData || '' }),
      });
      const data = await res.json();
      if (data.subscribed) setChannelSubscribed(data.newMana);
      else setChannelMsg(T.notSubYet[l]);
    } catch {
      setChannelMsg(T.notSubYet[l]);
    } finally {
      setChecking(false);
    }
  };

  // "15.08.1995 · ♌ Лев"
  const signIdx = user?.zodiacSign ? SIGN_KEYS.indexOf(user.zodiacSign as (typeof SIGN_KEYS)[number]) : -1;
  const birthValue = user?.birthDate
    ? `${user.birthDate.split('-').reverse().join('.')}${signIdx >= 0 ? ` · ${SIGN_GLYPHS[signIdx]} ${SIGN_NAMES[l][signIdx]}` : ''}`
    : null;

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
      <h1 className="t-screen mb-4">{T.title[l]}</h1>

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
            {(user?.displayName || user?.firstName)?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <p className={`t-card truncate ${isPremium ? '' : '!text-ink'}`}>
              {user?.displayName || user?.firstName || 'Guest'}
            </p>
            {/* One crown only: the status chip */}
            {isPremium ? (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-semibold tracking-wide border border-mystic-gold/40 bg-mystic-gold/10 text-mystic-gold">
                <Icon icon={Crown} size={12} /> Premium
              </span>
            ) : (
              <p className="text-xs text-mystic-accent">{subLabels[user?.subscription || 'none']}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.mana ?? 0}</p>
            <p className="text-micro text-mystic-muted flex items-center justify-center gap-1"><Icon icon={Gem} size={11} tone="lavender" /> {T.oracles[l]}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.streakDays || 0}</p>
            <p className="text-micro text-mystic-muted flex items-center justify-center gap-1"><Icon icon={Flame} size={11} /> {T.streak[l]}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{readingsTotal}</p>
            <p className="text-micro text-mystic-muted flex items-center justify-center gap-1"><Icon icon={Sparkles} size={11} tone="lavender" /> {T.readings[l]}</p>
          </div>
          <div className="bg-mystic-bg/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-mystic-accent">{user?.cardCollection?.length || 0}</p>
            <p className="text-micro text-mystic-muted flex items-center justify-center gap-1"><Icon icon={Layers} size={11} /> {T.cards[l]}</p>
          </div>
        </div>
      </motion.div>

      {/* My details: name, gender, language, birth date — tap a row to edit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="rounded-2xl mb-4 bg-mystic-card/80 border border-mystic-accent/20 aura-accent overflow-hidden"
      >
        <p className="px-4 pt-3.5 pb-1 text-micro uppercase tracking-[0.16em] text-mystic-muted">{T.myData[l]}</p>
        {[
          { icon: User, label: T.rowName[l], value: user?.displayName || user?.firstName || '—', onClick: () => setShowProfileSetup(true) },
          { icon: VenusAndMars, label: T.rowGender[l], value: user?.gender ? genderLabel : null, onClick: () => setShowProfileSetup(true) },
          { icon: Globe, label: T.rowLang[l], value: T.langName[l], onClick: () => setShowProfileSetup(true) },
          {
            icon: Cake,
            label: T.rowBirth[l],
            value: birthValue,
            onClick: () => setEditBirth((v) => !v),
          },
        ].map((row, i) => (
          <button
            key={row.label}
            onClick={row.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left ${i > 0 ? 'border-t border-mystic-accent/10' : ''}`}
          >
            <IconBadge icon={row.icon} size={32} />
            <span className="flex-1 text-sm text-mystic-muted">{row.label}</span>
            <span className={`text-sm ${row.value ? 'text-mystic-text' : 'text-mystic-gold font-semibold'}`}>
              {row.value ?? T.notSet[l]}
            </span>
            <Icon icon={ChevronRight} size={16} tone="muted" />
          </button>
        ))}
        {editBirth && (
          <div className="px-4 pb-4">
            <BirthDateCard
              locale={l}
              initial={user?.birthDate || ''}
              onSaved={() => setEditBirth(false)}
              onCancel={() => setEditBirth(false)}
            />
          </div>
        )}
      </motion.div>

      {/* Premium Status Card */}
      {isPremium ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl p-4 mb-4 bg-gradient-to-br from-mystic-gold/15 to-mystic-accent/10 border border-mystic-gold/30 aura-gold">
          <div className="flex items-center gap-3 mb-2">
            <IconBadge icon={Crown} size={44} />
            <div>
              <p className="t-section">{T.premiumActive[l]}</p>
              <p className="text-xs text-mystic-muted">
                {user?.premiumExpiresAt ? `${T.premiumExpires[l]} ${formatDate(user.premiumExpiresAt)} · ` : ''}
                {l === 'en' ? `${daysLabel(user?.premiumDaysLeft ?? 0, l)} left` : `${l === 'uk' ? 'ще' : 'ещё'} ${daysLabel(user?.premiumDaysLeft ?? 0, l)}`}
              </p>
              <p className="text-xs text-mystic-text/80 mt-0.5">{T.premiumUnlimited[l]}</p>
            </div>
          </div>
          {/* Savings counter — the concrete value of the subscription */}
          <div className="mt-2 flex items-center justify-between bg-mystic-bg/30 rounded-xl p-3">
            <span className="text-sm text-mystic-text">{T.premiumSaved[l]}</span>
            <span className="text-sm font-bold premium-price flex items-center gap-1">
              {(user?.premiumSaved ?? 0).toLocaleString('ru-RU')} <ManaIcon size="sm" />
            </span>
          </div>
          <p className="mt-2 text-micro text-mystic-muted flex items-start gap-1.5">
            <Icon icon={Orbit} size={13} className="mt-px" />
            {user?.premiumBigReportAvailable ? T.bigReportYes[l] : T.bigReportNo[l]}
          </p>
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
          <IconBadge icon={Crown} size={48} />
          <div className="flex-1 min-w-0">
            <p className="t-section">{T.getPremium[l]}</p>
            <p className="text-xs text-mystic-muted">{T.premiumUnlimited[l]}</p>
          </div>
          <Icon icon={ChevronRight} size={18} />
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
        <IconBadge icon={ScrollText} size={48} />
        <div className="flex-1 min-w-0">
          <p className="t-section">{T.history[l]}</p>
          <p className="text-xs text-mystic-muted">{T.historyDesc[l]}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span className="text-lg font-bold text-mystic-accent">{readingsTotal}</span>
          <Icon icon={ChevronRight} size={18} tone="muted" />
        </div>
      </motion.button>

      {/* Free oracles: daily streak, channel, invite */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-mystic-card/80 rounded-2xl p-4 border border-mystic-accent/20 mb-4 aura-accent">
        <h2 className="t-section mb-3 flex items-center gap-2">
          <Icon icon={Gift} size={18} /> {T.freeOracles[l]}
        </h2>
        <div className="space-y-2">
          {/* Daily check-in */}
          <div className="bg-mystic-bg/30 rounded-xl p-3 border border-mystic-accent/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-mystic-text flex items-center gap-2"><Icon icon={Flame} size={16} /> {T.dailyCheckIn[l]}</p>
              <span className="text-sm font-bold text-mystic-success flex items-center gap-1">
                +50/+300 <ManaIcon size="sm" />
              </span>
            </div>
            <div className="flex gap-1">
              {CHECKIN_DAYS.map((reward, i) => {
                const dayNum = i + 1;
                // Streak keeps counting past 7; the grid shows the current week of it
                const streakDays = user?.streakDays ?? 0;
                const cyclePos = streakDays > 0 ? ((streakDays - 1) % 7) + 1 : 0;
                const isCompleted = dayNum <= cyclePos;
                const isCurrent = dayNum === cyclePos;
                return (
                  <div key={i} className={`flex-1 rounded-lg py-1.5 text-center border flex flex-col items-center gap-0.5 ${
                    isCompleted
                      ? 'bg-mystic-gold/10 border-mystic-gold/35'
                      : 'bg-mystic-bg/30 border-mystic-accent/10'
                  } ${isCurrent ? 'ring-1 ring-mystic-gold/70' : ''}`}>
                    <p className="text-micro text-mystic-muted">{dayNum}</p>
                    {reward === 300
                      ? <Icon icon={Gift} size={13} tone={isCompleted ? 'gold' : 'muted'} />
                      : <p className={`text-micro font-bold ${isCompleted ? 'text-mystic-gold' : 'text-mystic-muted'}`}>+{reward}</p>}
                    {isCompleted
                      ? <Icon icon={Check} size={11} tone="green" />
                      : <span className="h-[11px]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Channel subscription — opens the channel, then checks and credits (Telegram only) */}
          {!user?.channelSubscribed && !appMode && (
            <div className="bg-mystic-bg/30 rounded-xl p-3 border border-mystic-accent/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon icon={Megaphone} size={16} />
                  <div className="min-w-0">
                    <p className="text-sm text-mystic-text">{T.channelSub[l]}</p>
                    <p className="text-xs text-mystic-muted">@cardsofmagic</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-mystic-success flex items-center gap-1">+1000 <ManaIcon size="sm" /></span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button onClick={openChannel}
                  className="py-2 rounded-lg text-xs font-bold bg-mystic-accent/15 border border-mystic-accent/25 text-mystic-accent">
                  {T.subscribe[l]}
                </button>
                <button onClick={checkChannel} disabled={checking}
                  className="py-2 rounded-lg text-xs font-bold bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold disabled:opacity-60">
                  {checking ? '…' : T.checkSub[l]}
                </button>
              </div>
              {channelMsg && <p className="mt-2 text-micro text-mystic-muted">{channelMsg}</p>}
            </div>
          )}

          {/* Invite a friend (referrals go through the bot: Telegram only) */}
          {!appMode && <div className="bg-mystic-bg/30 rounded-xl p-3 border border-mystic-accent/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-mystic-text flex items-center gap-2"><Icon icon={UserPlus} size={16} /> {T.invite[l]}</p>
              <span className="text-sm font-bold text-mystic-success flex items-center gap-1">+500 <ManaIcon size="sm" /></span>
            </div>
            <p className="text-xs text-mystic-muted mt-1">
              {T.inviteDesc[l]}
              {(user?.referralCount ?? 0) > 0 && <span className="text-mystic-success font-semibold"> · {T.invited[l]}: {user?.referralCount}</span>}
            </p>
            <button onClick={() => {
              const tg = (window as any).Telegram?.WebApp;
              if (tg) {
                const refLink = `https://t.me/cardsofmagic_bot?start=ref_${user?.telegramId || ''}`;
                tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(T.shareText[l])}`);
              }
            }}
              className="w-full py-2 rounded-lg bg-mystic-accent/15 border border-mystic-accent/25 text-mystic-accent text-xs font-bold mt-2.5 flex items-center justify-center gap-1.5">
              <Icon icon={Send} size={14} tone="lavender" /> {T.share[l]}
            </button>
          </div>}
        </div>
      </motion.div>

      {/* Android app: account, sign in / out, delete */}
      <AppAccountCard locale={l} />

      {/* Statistics */}
      <ReadingStats readings={readingHistory} l={l} />

      <ProfileSetupModal open={showProfileSetup} onClose={() => setShowProfileSetup(false)} />

      {/* Achievements */}
      <AchievementsSection
        readingsCount={readingsTotal}
        cardsCollected={user?.cardCollection || []}
        streakDays={user?.streakDays || 0}
        locale={l}
      />
    </div>
  );
}
