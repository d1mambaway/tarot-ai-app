'use client';

import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';

const PLANS = [
  {
    id: 'BASIC',
    icon: '⭐',
    name: { ru: 'Basic', uk: 'Basic' },
    price: 150,
    period: { ru: '/месяц', uk: '/місяць' },
    features: {
      ru: ['Безлимитные базовые расклады', 'Карта дня без ограничений', 'Бонус +3 чтения'],
      uk: ['Безлімітні базові розклади', 'Карта дня без обмежень', 'Бонус +3 читання'],
    },
    color: 'from-mystic-blue/40 to-mystic-card',
  },
  {
    id: 'PREMIUM',
    icon: '💎',
    name: { ru: 'Premium', uk: 'Premium' },
    price: 350,
    period: { ru: '/месяц', uk: '/місяць' },
    features: {
      ru: ['Все расклады без ограничений', 'Кельтский крест и глубокие расклады', 'Приоритет AI', 'Бонус +10 чтений'],
      uk: ['Всі розклади без обмежень', 'Кельтський хрест і глибокі розклади', 'Пріоритет AI', 'Бонус +10 читань'],
    },
    popular: true,
    color: 'from-mystic-purple/40 to-mystic-card',
  },
  {
    id: 'VIP',
    icon: '👑',
    name: { ru: 'VIP', uk: 'VIP' },
    price: 750,
    period: { ru: '/месяц', uk: '/місяць' },
    features: {
      ru: ['Всё из Premium', 'AI помнит тебя между сеансами', 'Персональный AI-астролог', 'Эксклюзивные расклады'],
      uk: ['Все з Premium', 'AI пам\'ятає тебе між сеансами', 'Персональний AI-астролог', 'Ексклюзивні розклади'],
    },
    color: 'from-mystic-gold/30 to-mystic-card',
  },
];

export default function ShopScreen() {
  const { user, locale } = useAppStore();
  const l = locale || 'ru';

  const handleBuy = (planId: string, price: number) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // TODO: call payment API
      tg.showAlert(l === 'uk' ? 'Оплата скоро буде доступна!' : 'Оплата скоро будет доступна!');
    }
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-1">
        ⭐ {l === 'uk' ? 'Магазин' : 'Магазин'}
      </h1>
      <p className="text-xs text-mystic-muted mb-5">
        {l === 'uk' ? 'Оплата через Telegram Stars' : 'Оплата через Telegram Stars'}
      </p>

      {/* Plans */}
      <div className="space-y-4">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-4 border bg-gradient-to-br ${plan.color} relative overflow-hidden ${
              plan.popular ? 'border-mystic-accent/50 glow-strong' : 'border-mystic-accent/20'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-mystic-accent to-mystic-gold text-mystic-bg text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                {l === 'uk' ? 'ПОПУЛЯРНИЙ' : 'ПОПУЛЯРНЫЙ'}
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{plan.icon}</span>
              <div>
                <h3 className="font-bold text-lg text-mystic-text">{plan.name[l]}</h3>
                <p className="text-mystic-accent font-bold">
                  {plan.price} ⭐ <span className="text-mystic-muted font-normal text-xs">{plan.period[l]}</span>
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 mb-4">
              {plan.features[l].map((feature, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-mystic-text/80">
                  <span className="text-mystic-accent text-xs">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleBuy(plan.id, plan.price)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                plan.popular
                  ? 'bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg'
                  : 'bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent'
              }`}
            >
              {l === 'uk' ? 'Підписатися' : 'Подписаться'} • {plan.price} ⭐
            </button>
          </motion.div>
        ))}
      </div>

      {/* Single readings info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-mystic-muted">
          {l === 'uk'
            ? '💡 Також можна купити окремі розклади за ⭐'
            : '💡 Также можно купить отдельные расклады за ⭐'}
        </p>
      </motion.div>
    </div>
  );
}
