'use client';

import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import ManaBalance from '@/components/ui/ManaBalance';

const MANA_PACKS = [
  {
    id: 'pack_500',
    mana: 500,
    stars: 50,
    label: { ru: 'Начало', uk: 'Початок' },
    icon: '✨',
    color: 'from-mystic-blue/30 to-mystic-card',
  },
  {
    id: 'pack_1500',
    mana: 1500,
    stars: 125,
    label: { ru: 'Стандарт', uk: 'Стандарт' },
    icon: '💫',
    color: 'from-mystic-purple/30 to-mystic-card',
    popular: true,
  },
  {
    id: 'pack_5000',
    mana: 5000,
    stars: 350,
    label: { ru: 'Премиум', uk: 'Преміум' },
    icon: '🔮',
    color: 'from-mystic-accent/20 to-mystic-card',
  },
  {
    id: 'pack_15000',
    mana: 15000,
    stars: 750,
    label: { ru: 'Мега', uk: 'Мега' },
    icon: '👑',
    color: 'from-mystic-gold/20 to-mystic-card',
    bonus: '+3000',
  },
];

export default function ShopScreen() {
  const { user, locale, addMana } = useAppStore();
  const l = locale || 'ru';

  const handleBuy = (packId: string, mana: number, stars: number) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // TODO: integrate with /api/payment for real Stars invoice
      tg.showAlert(
        l === 'uk'
          ? `Оплата ${stars} ⭐ Stars за ${mana} мани — скоро!`
          : `Оплата ${stars} ⭐ Stars за ${mana} маны — скоро!`
      );
    }
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold font-mystic text-gradient-gold flex items-center gap-2">
          <ManaIcon size="md" /> {l === 'uk' ? 'Магазин мани' : 'Магазин маны'}
        </h1>
        <ManaBalance />
      </div>
      <p className="text-xs text-mystic-muted mb-5">
        {l === 'uk' ? 'Купуй ману за Telegram Stars ⭐' : 'Покупай ману за Telegram Stars ⭐'}
      </p>

      {/* Mana packs */}
      <div className="space-y-3">
        {MANA_PACKS.map((pack, i) => (
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl p-4 border bg-gradient-to-br ${pack.color} relative overflow-hidden ${
              pack.popular ? 'border-mystic-accent/50 glow-strong' : 'border-mystic-accent/20'
            }`}
          >
            {pack.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-mystic-accent to-mystic-gold text-mystic-bg text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                {l === 'uk' ? 'ПОПУЛЯРНИЙ' : 'ПОПУЛЯРНЫЙ'}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{pack.icon}</span>
                <div>
                  <h3 className="font-bold text-mystic-text flex items-center gap-1.5">
                    <ManaIcon size="sm" />
                    <span className="text-lg">{pack.mana.toLocaleString()}</span>
                    {pack.bonus && (
                      <span className="text-xs text-green-400 font-bold">
                        {pack.bonus}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-mystic-muted">{pack.label[l]}</p>
                </div>
              </div>

              <button
                onClick={() => handleBuy(pack.id, pack.mana, pack.stars)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  pack.popular
                    ? 'bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg'
                    : 'bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent'
                }`}
              >
                {pack.stars} ⭐
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Free mana section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <h2 className="text-sm font-bold text-mystic-text mb-3">
          🎁 {l === 'uk' ? 'Безкоштовна мана' : 'Бесплатная мана'}
        </h2>

        <div className="space-y-2">
          {/* Channel sub */}
          {!user?.channelSubscribed && (
            <div className="flex items-center justify-between bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
              <div>
                <p className="text-sm text-mystic-text">📢 {l === 'uk' ? 'Підписка на канал' : 'Подписка на канал'}</p>
                <p className="text-xs text-mystic-muted">@cardsofmagic</p>
              </div>
              <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                +1000 <ManaIcon size="sm" />
              </span>
            </div>
          )}

          {/* Referral */}
          <div className="flex items-center justify-between bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
            <div>
              <p className="text-sm text-mystic-text">🎉 {l === 'uk' ? 'Запроси друга' : 'Пригласи друга'}</p>
              <p className="text-xs text-mystic-muted">{l === 'uk' ? 'За кожного друга' : 'За каждого друга'}</p>
            </div>
            <span className="text-sm font-bold text-green-400 flex items-center gap-1">
              +200 <ManaIcon size="sm" />
            </span>
          </div>

          {/* Daily streak */}
          <div className="flex items-center justify-between bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/10">
            <div>
              <p className="text-sm text-mystic-text">🔥 {l === 'uk' ? 'Щоденний вхід' : 'Ежедневный вход'}</p>
              <p className="text-xs text-mystic-muted">{l === 'uk' ? 'Скоро' : 'Скоро'}</p>
            </div>
            <span className="text-sm font-bold text-green-400 flex items-center gap-1">
              +50 <ManaIcon size="sm" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Price guide */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-mystic-muted">
          {l === 'uk'
            ? '💡 Один розклад = 30-200 мани залежно від складності'
            : '💡 Один расклад = 30-200 маны в зависимости от сложности'}
        </p>
      </motion.div>
    </div>
  );
}
