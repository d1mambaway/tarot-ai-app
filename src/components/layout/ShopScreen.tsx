'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import ManaBalance from '@/components/ui/ManaBalance';

type L = 'ru' | 'uk' | 'en';

// ─── Unique aura definitions (RGB) per premium plan ─────────────────────────

const PREMIUM_AURA: Record<string, {
  rgb: string;
  gradient: string;
  border: string;
  btnShadow: string;
}> = {
  // 1 month — Moonlit Silver-Blue: cool ethereal entry glow
  premium_1m: {
    rgb: '100,160,220',
    gradient: 'from-[rgba(100,160,220,0.15)] via-mystic-card to-[rgba(70,130,200,0.05)]',
    border: 'rgba(100,160,220,0.30)',
    btnShadow: '0 0 10px rgba(100,160,220,0.20)',
  },
  // 3 months — Royal Amethyst: rich purple with magenta highlights
  premium_3m: {
    rgb: '160,80,210',
    gradient: 'from-[rgba(160,80,210,0.20)] via-[rgba(123,45,142,0.12)] to-[rgba(200,120,255,0.08)]',
    border: 'rgba(160,80,210,0.50)',
    btnShadow: '0 0 14px rgba(160,80,210,0.35), 0 0 28px rgba(200,120,255,0.12)',
  },
  // 1 year — Phoenix Ember: warm crimson-gold, luxurious
  premium_1y: {
    rgb: '210,130,60',
    gradient: 'from-[rgba(210,130,60,0.15)] via-mystic-card to-[rgba(180,80,50,0.06)]',
    border: 'rgba(210,130,60,0.35)',
    btnShadow: '0 0 10px rgba(210,130,60,0.20)',
  },
};

// ─── Unique aura definitions (RGB) per mana pack ────────────────────────────

const MANA_AURA: Record<string, {
  rgb: string;
  rgbSecondary: string;
  gradient: string;
  border: string;
  btnShadow: string;
}> = {
  // Разведка — Stardust Cyan: soft teal-cyan, gentle and inviting
  pack_249: {
    rgb: '60,200,210',
    rgbSecondary: '40,160,190',
    gradient: 'from-[rgba(60,200,210,0.18)] to-[rgba(30,120,150,0.05)]',
    border: 'rgba(60,200,210,0.35)',
    btnShadow: '0 0 8px rgba(60,200,210,0.20)',
  },
  // Стандарт — Nebula Violet: intense violet-magenta, eye-catching
  pack_499: {
    rgb: '140,60,220',
    rgbSecondary: '180,90,255',
    gradient: 'from-[rgba(140,60,220,0.22)] to-[rgba(100,40,180,0.06)]',
    border: 'rgba(140,60,220,0.50)',
    btnShadow: '0 0 12px rgba(140,60,220,0.30)',
  },
  // Расширенный — Emerald Mystic: deep emerald green with golden shimmer
  pack_999: {
    rgb: '50,190,120',
    rgbSecondary: '80,210,150',
    gradient: 'from-[rgba(50,190,120,0.18)] to-[rgba(40,150,90,0.05)]',
    border: 'rgba(50,190,120,0.40)',
    btnShadow: '0 0 8px rgba(50,190,120,0.20)',
  },
  // Макс — Solar Flare: intense amber-orange with crimson edge
  pack_2499: {
    rgb: '230,160,50',
    rgbSecondary: '210,90,40',
    gradient: 'from-[rgba(230,160,50,0.20)] to-[rgba(210,90,40,0.08)]',
    border: 'rgba(230,160,50,0.45)',
    btnShadow: '0 0 10px rgba(230,160,50,0.25)',
  },
};

function getPremiumAuraStyle(planId: string, isPopular?: boolean) {
  const a = PREMIUM_AURA[planId];
  if (!a) return {};
  if (isPopular) {
    return {
      boxShadow: `0 0 20px rgba(${a.rgb},0.45), 0 0 45px rgba(${a.rgb},0.20), 0 0 70px rgba(${a.rgb},0.08), inset 0 0 18px rgba(${a.rgb},0.06)`,
      borderColor: a.border,
    };
  }
  return {
    boxShadow: `0 0 14px rgba(${a.rgb},0.30), 0 0 32px rgba(${a.rgb},0.12), inset 0 0 12px rgba(${a.rgb},0.04)`,
    borderColor: a.border,
  };
}

function getManaAuraStyle(packId: string, isPopular?: boolean) {
  const a = MANA_AURA[packId];
  if (!a) return {};
  if (isPopular) {
    return {
      boxShadow: `0 0 22px rgba(${a.rgb},0.45), 0 0 48px rgba(${a.rgbSecondary},0.18), 0 0 72px rgba(${a.rgb},0.08), inset 0 0 16px rgba(${a.rgb},0.05)`,
      borderColor: a.border,
    };
  }
  return {
    boxShadow: `0 0 14px rgba(${a.rgb},0.30), 0 0 30px rgba(${a.rgbSecondary},0.12), inset 0 0 10px rgba(${a.rgb},0.04)`,
    borderColor: a.border,
  };
}

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
  { id: 'pack_249', mana: 750, stars: 249, label: { ru: 'Разведка', uk: 'Розвідка', en: 'Scout' }, icon: '✨' },
  { id: 'pack_499', mana: 1750, stars: 499, label: { ru: 'Стандарт', uk: 'Стандарт', en: 'Standard' }, icon: '💫', popular: true, bonus: '+16%' },
  { id: 'pack_999', mana: 4000, stars: 999, label: { ru: 'Расширенный', uk: 'Розширений', en: 'Extended' }, icon: '🔮', bonus: '+33%' },
  { id: 'pack_2499', mana: 11000, stars: 2499, label: { ru: 'Макс', uk: 'Макс', en: 'Max' }, icon: '👑', bonus: '+46%' },
];

const T = {
  title: { ru: 'Магазин', uk: 'Магазин', en: 'Shop' },
  sub: { ru: 'Премиум и оракулы за Telegram Stars ⭐', uk: 'Преміум та оракули за Telegram Stars ⭐', en: 'Premium and oracles with Telegram Stars ⭐' },
  premiumTitle: { ru: 'Премиум подписка', uk: 'Преміум підписка', en: 'Premium Subscription' },
  // Leads the section — one big, concrete promise instead of a flat bullet
  // list where nothing stands out. This is the reason people actually
  // subscribe; the rest of premiumFeatures below is supporting detail.
  premiumHero: { ru: 'Оракулы больше не тратятся', uk: 'Оракули більше не витрачаються', en: 'Oracles never run out' },
  premiumDesc: { ru: 'Безлимитный доступ ко всем функциям', uk: 'Безлімітний доступ до всіх функцій', en: 'Unlimited access to all features' },
  premiumFeatures: {
    ru: ['Безлимит раскладов и чтений', 'Все виды гаданий'],
    uk: ['Безлімітні розклади та читання', 'Усі види ворожінь'],
    en: ['Unlimited spreads & readings', 'All divination types'],
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
            <div
              className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-mystic-gold/15 to-mystic-accent/10 border border-mystic-gold/30"
              style={{ boxShadow: '0 0 18px rgba(212,175,55,0.15), 0 0 36px rgba(212,175,55,0.06)' }}
            >
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

          {/* Premium description — one big value prop leads, the rest is supporting detail */}
          <div
            className="rounded-2xl p-5 mb-3 bg-gradient-to-br from-mystic-gold/12 via-mystic-card to-mystic-accent/6 border border-mystic-gold/25 relative overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(212,175,55,0.12), 0 0 40px rgba(196,163,90,0.06)' }}
          >
            <p className="text-xl font-bold font-mystic text-gradient-gold mb-1 leading-snug">
              ♾️ {T.premiumHero[l]}
            </p>
            <p className="text-xs text-mystic-muted mb-3">{T.premiumDesc[l]}</p>
            <div className="space-y-1 pt-2.5 border-t border-mystic-gold/15">
              {T.premiumFeatures[l].map((feat, i) => (
                <p key={i} className="text-[11px] text-mystic-muted flex items-center gap-1.5">
                  <span className="text-mystic-gold/70">✦</span> {feat}
                </p>
              ))}
            </div>
          </div>

          {/* Plan cards — each with unique aura */}
          <div className="space-y-2.5">
            {PREMIUM_PLANS.map((plan, i) => {
              const aura = PREMIUM_AURA[plan.id];
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border relative overflow-hidden ${
                    plan.popular
                      ? `p-4 bg-gradient-to-r ${aura.gradient}`
                      : `p-3.5 bg-gradient-to-br ${aura.gradient}`
                  }`}
                  style={getPremiumAuraStyle(plan.id, plan.popular)}
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
                      style={{ boxShadow: aura.btnShadow }}
                    >
                      {buying === plan.id ? '...' : `${plan.stars} ⭐`}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Mana Packs Section ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-bold text-mystic-accent flex items-center gap-2 mb-3">
            <ManaIcon size="sm" /> {T.oraclesTitle[l]}
          </h2>

          <div className="space-y-3">
            {MANA_PACKS.map((pack, i) => {
              const aura = MANA_AURA[pack.id];
              return (
                <motion.div key={pack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                  className={`rounded-2xl p-4 border bg-gradient-to-br ${aura.gradient} relative overflow-hidden`}
                  style={getManaAuraStyle(pack.id, pack.popular)}>
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
                      style={{ boxShadow: aura.btnShadow }}>
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
