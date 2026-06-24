'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import ManaBalance from '@/components/ui/ManaBalance';

type L = 'ru' | 'uk' | 'en';

const PREMIUM_PLANS = [
  { id: 'premium_1m', months: 1, stars: 1500, label: { ru: '1 месяц', uk: '1 місяць', en: '1 month' } },
  { id: 'premium_3m', months: 3, stars: 3500, label: { ru: '3 месяца', uk: '3 місяці', en: '3 months' }, popular: true, save: { ru: 'Выгодно', uk: 'Вигідно', en: 'Best deal' } },
  { id: 'premium_1y', months: 12, stars: 6000, label: { ru: '1 год', uk: '1 рік', en: '1 year' }, save: { ru: 'Макс скидка', uk: 'Макс знижка', en: 'Max savings' } },
];

const MANA_PACKS = [
  { id: 'pack_500', mana: 500, stars: 500, label: { ru: 'Начало', uk: 'Початок', en: 'Starter' }, icon: '✨', color: 'from-mystic-blue/30 to-mystic-card' },
  { id: 'pack_1500', mana: 1500, stars: 1500, label: { ru: 'Стандарт', uk: 'Стандарт', en: 'Standard' }, icon: '💫', color: 'from-mystic-purple/30 to-mystic-card', popular: true },
  { id: 'pack_5000', mana: 5000, stars: 5000, label: { ru: 'Премиум', uk: 'Преміум', en: 'Premium' }, icon: '🔮', color: 'from-mystic-accent/20 to-mystic-card' },
  { id: 'pack_15000', mana: 15000, stars: 15000, label: { ru: 'Мега', uk: 'Мега', en: 'Mega' }, icon: '👑', color: 'from-mystic-gold/20 to-mystic-card', bonus: '+3000' },
];

const T = {
  title: { ru: 'Магазин', uk: 'Магазин', en: 'Shop' },
  sub: { ru: 'Премиум и оракулы за Telegram Stars ⭐', uk: 'Преміум та оракули за Telegram Stars ⭐', en: 'Premium and oracles with Telegram Stars ⭐' },
  premiumTitle: { ru: 'Премиум подписка', uk: 'Преміум підписка', en: 'Premium Subscription' },
  premiumDesc: { ru: 'Безлимитный доступ ко всем функциям', uk: 'Безлімітний доступ до всіх функцій', en: 'Unlimited access to all features' },
  premiumFeatures: {
    ru: ['Безлимит раскладов и чтений', 'Нет затрат оракулов', 'Все виды гаданий'],
    uk: ['Безлімітні розклади та читання', 'Немає витрат оракулів', 'Усі види ворожінь'],
    en: ['Unlimited spreads & readings', 'No oracle cost', 'All divination types'],
  },
  premiumActive: { ru: 'Премиум активен', uk: 'Преміум активний', en: 'Premium active' },
  premiumExpires: { ru: 'до', uk: 'до', en: 'until' },
  premiumDaysLeft: { ru: 'Осталось дней', uk: 'Залишилось днів', en: 'Days left' },
  oraclesTitle: { ru: 'Оракулы', uk: 'Оракули', en: 'Oracles' },
  popular: { ru: 'ПОПУЛЯРНЫЙ', uk: 'ПОПУЛЯРНИЙ', en: 'POPULAR' },
  howTo: { ru: 'Как купить Stars?', uk: 'Як купити Stars?', en: 'How to buy Stars?' },
  howToSteps: {
    ru: [
      'Открой Telegram → Настройки',
      'Нажми «Мои Stars» (или «My Stars»)',
      'Купи нужное количество через Apple Pay / Google Pay',
      'Вернись сюда и выбери набор оракулов ✨',
    ],
    uk: [
      'Відкрий Telegram → Налаштування',
      'Натисни «Мої Stars» (або «My Stars»)',
      'Купи потрібну кількість через Apple Pay / Google Pay',
      'Повернись сюди та обери набір оракулів ✨',
    ],
    en: [
      'Open Telegram → Settings',
      'Tap "My Stars"',
      'Buy the amount you need via Apple Pay / Google Pay',
      'Come back here and choose an oracle pack ✨',
    ],
  },
};

export default function ShopScreen() {
  const { user, locale, addMana, setPremium } = useAppStore();
  const l = (locale || 'ru') as L;
  const [buying, setBuying] = useState<string | null>(null);
  const isPremium = user?.isPremium ?? false;

  const handleBuy = async (packId: string, manaAmount?: number) => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    if (buying) return;

    setBuying(packId);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, packId }),
      });
      const data = await res.json();
      if (!data.ok) {
        tg.showAlert(data.error || 'Error');
        setBuying(null);
        return;
      }

      tg.openInvoice(data.invoiceUrl, (status: string) => {
        if (status === 'paid') {
          if (data.type === 'premium') {
            const plan = PREMIUM_PLANS.find(p => p.id === packId);
            const days = plan ? plan.months * 30 : 30;
            const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            setPremium(true, expiresAt, days);
          } else if (manaAmount) {
            addMana(manaAmount);
          }
          tg.HapticFeedback?.notificationOccurred('success');
        }
        setBuying(null);
      });
    } catch {
      const tg = (window as any).Telegram?.WebApp;
      tg?.showAlert('Error creating invoice');
      setBuying(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(l === 'uk' ? 'uk-UA' : l === 'en' ? 'en-US' : 'ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className="relative z-10">
      <div className="px-4 pt-4 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold font-mystic text-gradient-gold flex items-center gap-2">
            🛒 {T.title[l]}
          </h1>
          <ManaBalance />
        </div>
        <p className="text-xs text-mystic-muted mb-5">{T.sub[l]}</p>

        {/* ─── Premium Section ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-sm font-bold text-mystic-gold flex items-center gap-2 mb-3">
            👑 {T.premiumTitle[l]}
          </h2>

          {/* Active premium banner */}
          {isPremium && (
            <div className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-mystic-gold/15 to-mystic-accent/10 border border-mystic-gold/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">👑</span>
                <span className="font-bold text-mystic-gold">{T.premiumActive[l]}</span>
              </div>
              {user?.premiumExpiresAt && (
                <p className="text-xs text-mystic-muted">
                  {T.premiumExpires[l]} {formatDate(user.premiumExpiresAt)} · {T.premiumDaysLeft[l]}: {user.premiumDaysLeft}
                </p>
              )}
            </div>
          )}

          {/* Premium description */}
          <div className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-mystic-gold/10 via-mystic-card to-mystic-accent/5 border border-mystic-gold/20">
            <p className="text-xs text-mystic-muted mb-2">{T.premiumDesc[l]}</p>
            <div className="space-y-1">
              {T.premiumFeatures[l].map((feat, i) => (
                <p key={i} className="text-xs text-mystic-text flex items-center gap-1.5">
                  <span className="text-mystic-gold">✦</span> {feat}
                </p>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="space-y-2.5">
            {PREMIUM_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border relative overflow-hidden ${
                  plan.popular
                    ? 'p-4 bg-gradient-to-r from-mystic-gold/20 via-mystic-accent/15 to-mystic-gold/10 border-mystic-gold/50'
                    : 'p-3.5 bg-mystic-card/80 border-mystic-gold/15'
                }`}
                style={plan.popular ? {
                  boxShadow: '0 0 20px rgba(212,175,55,0.15), 0 0 40px rgba(196,163,90,0.08)',
                } : {
                  boxShadow: '0 0 10px rgba(212,175,55,0.06)',
                }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-mystic-accent to-mystic-gold text-mystic-bg text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    {T.popular[l]}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div>
                      <h3 className="font-bold text-mystic-gold text-sm">
                        {plan.label[l]}
                        {plan.save && (
                          <span className="ml-2 text-[10px] text-green-400 font-bold">{plan.save[l]}</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-mystic-muted">Premium</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={buying === plan.id}
                    className={`rounded-xl font-bold text-sm transition-all ${
                      buying === plan.id ? 'opacity-50' : ''
                    } ${
                      plan.popular
                        ? 'px-5 py-2.5 bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg'
                        : 'px-4 py-2 bg-mystic-gold/20 border border-mystic-gold/30 text-mystic-gold'
                    }`}
                    style={plan.popular ? {
                      boxShadow: '0 0 12px rgba(123,45,142,0.3)',
                    } : undefined}
                  >
                    {buying === plan.id ? '...' : `${plan.stars} ⭐`}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── Mana Packs Section ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-bold text-mystic-accent flex items-center gap-2 mb-3">
            <ManaIcon size="sm" /> {T.oraclesTitle[l]}
          </h2>

          <div className="space-y-3">
            {MANA_PACKS.map((pack, i) => (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                className={`rounded-2xl p-4 border bg-gradient-to-br ${pack.color} relative overflow-hidden ${pack.popular ? 'border-mystic-accent/50' : 'border-mystic-accent/20'}`}
                style={pack.popular ? {
                  boxShadow: '0 0 25px rgba(196,163,90,0.2), 0 0 50px rgba(123,45,142,0.12)',
                } : {
                  boxShadow: '0 0 12px rgba(123,45,142,0.08), 0 0 24px rgba(196,163,90,0.05)',
                }}>
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
                  <button onClick={() => handleBuy(pack.id, pack.mana)}
                    disabled={buying === pack.id}
                    className={`rounded-xl font-bold text-sm transition-all ${buying === pack.id ? 'opacity-50' : ''} ${pack.popular ? 'px-5 py-2.5 bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg' : 'px-5 py-2.5 bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent'}`}
                    style={pack.popular ? {
                      boxShadow: '0 0 12px rgba(123,45,142,0.25)',
                    } : {
                      boxShadow: '0 0 8px rgba(196,163,90,0.1)',
                    }}>
                    {buying === pack.id ? '...' : `${pack.stars} ⭐`}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How to buy Stars hint */}
        <details className="mt-5 group">
          <summary className="text-xs text-mystic-accent/70 cursor-pointer flex items-center gap-1.5 hover:text-mystic-accent transition-colors">
            <span>💡</span> {T.howTo[l]}
          </summary>
          <div className="mt-2 p-3 rounded-xl bg-mystic-card/50 border border-mystic-accent/10">
            <ol className="text-xs text-mystic-muted space-y-1.5 list-decimal list-inside">
              {T.howToSteps[l].map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </details>
      </div>
    </div>
  );
}
