'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import ManaBalance from '@/components/ui/ManaBalance';
import HomePromo from '@/components/ui/HomePromo';
import GiftPremium from '@/components/ui/GiftPremium';
import { Icon, IconBadge } from '@/components/ui/Icon';
import { CircleHelp, Crown, Gem, Sparkle, Sparkles } from 'lucide-react';

type L = 'ru' | 'uk' | 'en';


const PREMIUM_PLANS = [
  { id: 'premium_1m', months: 1, stars: 499, label: { ru: '1 месяц', uk: '1 місяць', en: '1 month' } },
  { id: 'premium_3m', months: 3, stars: 999, label: { ru: '3 месяца', uk: '3 місяці', en: '3 months' }, popular: true, save: { ru: 'Выгодно', uk: 'Вигідно', en: 'Best deal' } },
  { id: 'premium_1y', months: 12, stars: 2499, label: { ru: '1 год', uk: '1 рік', en: '1 year' }, save: { ru: 'Макс скидка', uk: 'Макс знижка', en: 'Max savings' } },
];

// Цены — 249/499/999/2499⭐: на 1⭐ дешевле реальных пачек Stars в Telegram
// (250/500/1000/2500⭐), так что "круглое" число всё равно оплачивается
// целиком, а воспринимается как более выгодное. Те же 499/999/2499, что и у
// Premium-планов выше — единый узнаваемый прайс по всему магазину.
// Курс растёт вместе с размером пака (база — 3 оракула/⭐ на pack_249),
// поэтому у бонуса есть реальное экономическое основание. Верхний пак не
// задран выше цены годового Premium — так сравнение "разово или подписка"
// работает честно.
const MANA_PACKS = [
  { id: 'pack_249', mana: 750, stars: 249, label: { ru: 'Разведка', uk: 'Розвідка', en: 'Scout' }, icon: Sparkle },
  { id: 'pack_499', mana: 1750, stars: 499, label: { ru: 'Стандарт', uk: 'Стандарт', en: 'Standard' }, icon: Sparkles, popular: true, bonus: '+16%' },
  { id: 'pack_999', mana: 4000, stars: 999, label: { ru: 'Расширенный', uk: 'Розширений', en: 'Extended' }, icon: Gem, bonus: '+33%' },
  { id: 'pack_2499', mana: 11000, stars: 2499, label: { ru: 'Макс', uk: 'Макс', en: 'Max' }, icon: Crown, bonus: '+46%' },
];

const T = {
  title: { ru: 'Магазин', uk: 'Магазин', en: 'Shop' },
  sub: { ru: 'Премиум и оракулы за Telegram Stars ⭐', uk: 'Преміум та оракули за Telegram Stars ⭐', en: 'Premium and oracles with Telegram Stars ⭐' },
  premiumTitle: { ru: 'Премиум подписка', uk: 'Преміум підписка', en: 'Premium Subscription' },
  // Leads the section — one big, concrete promise instead of a flat bullet
  // list where nothing stands out. This is the reason people actually
  // subscribe; the rest of premiumFeatures below is supporting detail.
  premiumHero: { ru: 'Гадай без счёта', uk: 'Ворожи без ліку', en: 'Read without limits' },
  premiumDesc: {
    ru: 'Спрашивай карты сколько хочешь — баланс оракулов не уменьшается',
    uk: 'Питай карти скільки завгодно — баланс оракулів не зменшується',
    en: 'Ask the cards as often as you like — your oracle balance stays put',
  },
  premiumFeatures: {
    ru: ['Таро, руны, гороскоп, сны и ещё 15 практик бесплатно', 'Натальная карта или Матрица судьбы в подарок каждый месяц', 'Кельтский крест — самый глубокий расклад, только в Premium', 'Золотое оформление и корона у имени'],
    uk: ['Таро, руни, гороскоп, сни та ще 15 практик безкоштовно', 'Натальна карта або Матриця долі в подарунок щомісяця', 'Кельтський хрест — найглибший розклад, лише в Premium', 'Золоте оформлення та корона біля імені'],
    en: ['Tarot, runes, horoscope, dreams and 15 more for free', 'A natal chart or Destiny matrix as a gift every month', 'Celtic cross — the deepest spread, Premium only', 'Gold theme and a crown by your name'],
  },
  saved: { ru: 'Сэкономлено оракулов', uk: 'Заощаджено оракулів', en: 'Oracles saved' },
  premiumActive: { ru: 'Премиум активен', uk: 'Преміум активний', en: 'Premium active' },
  premiumExpires: { ru: 'до', uk: 'до', en: 'until' },
  premiumDaysLeft: { ru: 'Осталось дней', uk: 'Залишилось днів', en: 'Days left' },
  oraclesTitle: { ru: 'Оракулы', uk: 'Оракули', en: 'Oracles' },
  popular: { ru: 'ПОПУЛЯРНЫЙ', uk: 'ПОПУЛЯРНИЙ', en: 'POPULAR' },
  howTo: { ru: 'Как купить Stars?', uk: 'Як купити Stars?', en: 'How to buy Stars?' },
  howToSteps: {
    ru: [
      'Открой Telegram → Настройки',
      'Нажми «Мои звёзды»',
      'Купи нужное количество через Apple Pay / Google Pay',
      'Вернись сюда и выбери набор оракулов ✨',
    ],
    uk: [
      'Відкрий Telegram → Налаштування',
      'Натисни «Мої зірки»',
      'Купи потрібну кількість через Apple Pay / Google Pay',
      'Повернись сюди та обери набір оракулів ✨',
    ],
    en: [
      'Open Telegram → Settings',
      'Tap "Stars"',
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
          <h1 className="t-screen flex items-center gap-2">
            {T.title[l]}
          </h1>
          <ManaBalance />
        </div>
        <p className="text-xs text-mystic-muted mb-5">{T.sub[l]}</p>

        {/* New users: one-time starter offer */}
        {!isPremium && user?.starterOfferEndsAt && new Date(user.starterOfferEndsAt).getTime() > Date.now() && (
          <div className="mb-5">
            <HomePromo />
          </div>
        )}

        {/* ─── Premium Section ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="t-section flex items-center gap-2 mb-3">
            <Icon icon={Crown} size={16} /> {T.premiumTitle[l]}
          </h2>

          {/* Active premium banner */}
          {isPremium && (
            <div
              className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-mystic-gold/15 to-mystic-accent/10 border border-mystic-gold/30"
              style={{ boxShadow: '0 0 18px rgba(212,175,55,0.15), 0 0 36px rgba(212,175,55,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon icon={Crown} size={20} />
                <span className="t-section">{T.premiumActive[l]}</span>
              </div>
              {user?.premiumExpiresAt && (
                <p className="text-xs text-mystic-muted">
                  {T.premiumExpires[l]} {formatDate(user.premiumExpiresAt)} · {T.premiumDaysLeft[l]}: {user.premiumDaysLeft}
                </p>
              )}
              {(user?.premiumSaved ?? 0) > 0 && (
                <p className="text-xs text-mystic-text/85 mt-1 flex items-center gap-1">
                  {T.saved[l]}: <b className="premium-price">{user!.premiumSaved!.toLocaleString('ru-RU')}</b> <ManaIcon size="sm" />
                </p>
              )}
            </div>
          )}

          {/* Premium description — one big value prop leads, the rest is supporting detail */}
          <div
            className="rounded-2xl p-5 mb-3 bg-gradient-to-br from-mystic-gold/12 via-mystic-card to-mystic-accent/6 border border-mystic-gold/25 relative overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(212,175,55,0.12), 0 0 40px rgba(196,163,90,0.06)' }}
          >
            <p className="text-2xl font-display font-semibold mb-1 leading-snug">
              <span className="text-gradient-gold">{T.premiumHero[l]}</span>
            </p>
            <p className="text-sm text-mystic-text/80 mb-3">{T.premiumDesc[l]}</p>
            <div className="space-y-1 pt-2.5 border-t border-mystic-gold/15">
              {T.premiumFeatures[l].map((feat, i) => (
                <p key={i} className="text-sm text-mystic-text/85 flex items-start gap-1.5 leading-snug">
                  <span className="text-mystic-gold/70">✦</span> {feat}
                </p>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="space-y-2.5">
            {PREMIUM_PLANS.map((plan, i) => {
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`brand-card relative overflow-hidden ${plan.popular ? 'p-4 premium-card' : 'p-3.5'}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-mystic-accent to-mystic-gold text-mystic-bg text-micro font-bold px-3 py-1 rounded-bl-xl">
                      {T.popular[l]}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconBadge icon={Crown} size={40} />
                      <div>
                        <h3 className="t-section">
                          {plan.label[l]}
                          {plan.save && (
                            <span className="ml-2 font-sans text-micro text-mystic-success font-semibold align-middle">{plan.save[l]}</span>
                          )}
                        </h3>
                        <p className="text-micro text-mystic-muted">Premium</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBuy(plan.id)}
                      disabled={buying === plan.id}
                      className={`rounded-xl font-bold text-sm transition-all ${
                        buying === plan.id ? 'opacity-50' : ''
                      } ${
                        plan.popular
                          ? 'px-5 py-2.5 bg-gradient-to-r from-gold-soft to-mystic-gold text-mystic-bg'
                          : 'px-4 py-2 bg-mystic-gold/20 border border-mystic-gold/30 text-mystic-gold'
                      }`}
                      
                    >
                      {buying === plan.id ? '...' : `${plan.stars} ⭐`}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Premium as a gift — one-time link sent to the buyer's bot chat */}
          <GiftPremium locale={l} />
        </motion.div>

        {/* ─── Mana Packs Section ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="t-section flex items-center gap-2 mb-3">
            <ManaIcon size="sm" /> {T.oraclesTitle[l]}
          </h2>

          <div className="space-y-3">
            {MANA_PACKS.map((pack, i) => {
              return (
                <motion.div key={pack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                  className={`brand-card p-4 relative overflow-hidden ${pack.popular ? 'premium-card' : ''}`}>
                  {pack.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-mystic-accent to-mystic-gold text-mystic-bg text-micro font-bold px-3 py-1 rounded-bl-xl">
                      {T.popular[l]}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconBadge icon={pack.icon} size={44} tone="lavender" />
                      <div>
                        <h3 className="font-bold text-mystic-text flex items-center gap-1.5">
                          <ManaIcon size="sm" />
                          <span className="text-lg">{pack.mana.toLocaleString()}</span>
                          {pack.bonus && <span className="text-xs text-mystic-success font-bold">{pack.bonus}</span>}
                        </h3>
                        <p className="text-xs text-mystic-muted">{pack.label[l]}</p>
                      </div>
                    </div>
                    <button onClick={() => handleBuy(pack.id, pack.mana)}
                      disabled={buying === pack.id}
                      className={`rounded-xl font-bold text-sm transition-all ${buying === pack.id ? 'opacity-50' : ''} ${pack.popular ? 'px-5 py-2.5 bg-gradient-to-r from-gold-soft to-mystic-gold text-mystic-bg' : 'px-5 py-2.5 bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent'}`}
                      >
                      {buying === pack.id ? '...' : `${pack.stars} ⭐`}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How to buy Stars hint */}
        <details className="mt-5 group">
          <summary className="text-xs text-mystic-accent/70 cursor-pointer flex items-center gap-1.5 hover:text-mystic-accent transition-colors">
            <Icon icon={CircleHelp} size={15} /> {T.howTo[l]}
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
