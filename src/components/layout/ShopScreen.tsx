'use client';

import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import ManaBalance from '@/components/ui/ManaBalance';

type L = 'ru' | 'uk' | 'en';

const MANA_PACKS = [
  { id: 'pack_500', mana: 500, stars: 50, label: { ru: 'Начало', uk: 'Початок', en: 'Starter' }, icon: '✨', color: 'from-mystic-blue/30 to-mystic-card' },
  { id: 'pack_1500', mana: 1500, stars: 125, label: { ru: 'Стандарт', uk: 'Стандарт', en: 'Standard' }, icon: '💫', color: 'from-mystic-purple/30 to-mystic-card', popular: true },
  { id: 'pack_5000', mana: 5000, stars: 350, label: { ru: 'Премиум', uk: 'Преміум', en: 'Premium' }, icon: '🔮', color: 'from-mystic-accent/20 to-mystic-card' },
  { id: 'pack_15000', mana: 15000, stars: 750, label: { ru: 'Мега', uk: 'Мега', en: 'Mega' }, icon: '👑', color: 'from-mystic-gold/20 to-mystic-card', bonus: '+3000' },
];

const T = {
  title: { ru: 'Магазин маны', uk: 'Магазин мани', en: 'Mana Shop' },
  sub: { ru: 'Покупай ману за Telegram Stars ⭐', uk: 'Купуй ману за Telegram Stars ⭐', en: 'Buy mana with Telegram Stars ⭐' },
  popular: { ru: 'ПОПУЛЯРНЫЙ', uk: 'ПОПУЛЯРНИЙ', en: 'POPULAR' },
  freeMana: { ru: 'Бесплатная мана', uk: 'Безкоштовна мана', en: 'Free mana' },
  channelSub: { ru: 'Подписка на канал', uk: 'Підписка на канал', en: 'Channel subscription' },
  inviteFriend: { ru: 'Пригласи друга', uk: 'Запроси друга', en: 'Invite a friend' },
  perFriend: { ru: 'За каждого друга', uk: 'За кожного друга', en: 'Per friend' },
  dailyLogin: { ru: 'Ежедневный вход', uk: 'Щоденний вхід', en: 'Daily login' },
  soon: { ru: 'Скоро', uk: 'Скоро', en: 'Soon' },
  priceHint: { ru: 'Один расклад = 50-200 маны в зависимости от сложности', uk: 'Один розклад = 50-200 мани залежно від складності', en: 'One reading = 50-200 mana depending on complexity' },
};

export default function ShopScreen() {
  const { user, locale, addMana } = useAppStore();
  const l = (locale || 'ru') as L;

  const handleBuy = async (packId: string, mana: number, stars: number) => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, packId }),
      });
      const data = await res.json();
      if (!data.ok) {
        tg.showAlert(data.error || 'Error');
      }
      // Invoice sent via bot — user pays in TG chat
    } catch {
      tg.showAlert('Error creating invoice');
    }
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold font-mystic text-gradient-gold flex items-center gap-2">
          <ManaIcon size="md" /> {T.title[l]}
        </h1>
        <ManaBalance />
      </div>
      <p className="text-xs text-mystic-muted mb-5">{T.sub[l]}</p>

      <div className="space-y-3">
        {MANA_PACKS.map((pack, i) => (
          <motion.div key={pack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-2xl p-4 border bg-gradient-to-br ${pack.color} relative overflow-hidden ${pack.popular ? 'border-mystic-accent/50 glow-strong' : 'border-mystic-accent/20'}`}>
            {pack.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-mystic-accent to-mystic-gold text-mystic-bg text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                {T.popular[l]}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{pack.icon}</span>
                <div>
                  <h3 className="font-bold text-mystic-text flex items-center gap-1.5">
                    <ManaIcon size="sm" />
                    <span className="text-lg">{pack.mana.toLocaleString()}</span>
                    {pack.bonus && <span className="text-xs text-green-400 font-bold">{pack.bonus}</span>}
                  </h3>
                  <p className="text-xs text-mystic-muted">{pack.label[l]}</p>
                </div>
              </div>
              <button onClick={() => handleBuy(pack.id, pack.mana, pack.stars)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${pack.popular ? 'bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg' : 'bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent'}`}>
                {pack.stars} ⭐
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6">
        <h2 className="text-sm font-bold text-mystic-text mb-3">🎁 {T.freeMana[l]}</h2>
        <div className="space-y-2">
          {!user?.channelSubscribed && (
            <div className="flex items-center justify-between bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
              <div>
                <p className="text-sm text-mystic-text">📢 {T.channelSub[l]}</p>
                <p className="text-xs text-mystic-muted">@cardsofmagic</p>
              </div>
              <span className="text-sm font-bold text-green-400 flex items-center gap-1">+1000 <ManaIcon size="sm" /></span>
            </div>
          )}
          <div className="flex items-center justify-between bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
            <div>
              <p className="text-sm text-mystic-text">🎉 {T.inviteFriend[l]}</p>
              <p className="text-xs text-mystic-muted">{T.perFriend[l]}</p>
            </div>
            <span className="text-sm font-bold text-green-400 flex items-center gap-1">+200 <ManaIcon size="sm" /></span>
          </div>
          <div className="flex items-center justify-between bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
            <div>
              <p className="text-sm text-mystic-text">🔥 {T.dailyLogin[l]}</p>
              <p className="text-xs text-mystic-muted">{T.soon[l]}</p>
            </div>
            <span className="text-sm font-bold text-green-400 flex items-center gap-1">+50 <ManaIcon size="sm" /></span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center">
        <p className="text-xs text-mystic-muted">💡 {T.priceHint[l]}</p>
      </motion.div>
    </div>
  );
}
