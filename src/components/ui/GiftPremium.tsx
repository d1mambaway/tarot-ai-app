'use client';

/**
 * "Gift Premium to a friend": pick a plan, pay with Stars, and the one-time
 * gift link arrives in the chat with the bot (with a "send to a friend" button).
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PREMIUM_PLANS, GIFT_PREFIX, type PremiumPlanId } from '@/lib/shop';
import { startPurchase } from '@/lib/purchase';
import { Icon } from './Icon';
import { Gift } from 'lucide-react';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Подарить Premium другу', uk: 'Подарувати Premium другові', en: 'Gift Premium to a friend' },
  text: {
    ru: 'После оплаты ссылка-подарок придёт в чат с ботом — перешли её другу',
    uk: 'Після оплати посилання-подарунок прийде в чат з ботом — перешли його другові',
    en: 'After payment the gift link arrives in the bot chat — forward it to a friend',
  },
  done: {
    ru: 'Готово! Ссылка-подарок уже в чате с ботом',
    uk: 'Готово! Посилання-подарунок уже в чаті з ботом',
    en: 'Done! The gift link is in the bot chat',
  },
};

export default function GiftPremium({ locale }: { locale: L }) {
  const [buying, setBuying] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const buy = async (planId: PremiumPlanId) => {
    if (buying) return;
    setBuying(planId);
    const res = await startPurchase(`${GIFT_PREFIX}${planId}`);
    setBuying(null);
    if (res.status === 'paid') setDone(true);
    else if (res.status === 'error') (window as any).Telegram?.WebApp?.showAlert?.(res.error || 'Error');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mt-3 premium-card"
    >
      <p className="text-sm font-bold flex items-center gap-2"><Icon icon={Gift} size={17} /> <span className="premium-price">{T.title[locale]}</span></p>
      <p className="text-[11px] text-mystic-muted mt-1 leading-snug">{done ? T.done[locale] : T.text[locale]}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(PREMIUM_PLANS) as PremiumPlanId[]).map((id) => (
          <button
            key={id}
            onClick={() => buy(id)}
            disabled={!!buying}
            className="rounded-xl py-2 px-1 border border-mystic-gold/30 bg-black/20 text-center disabled:opacity-60"
          >
            <span className="block text-[12px] text-mystic-text/90">{PREMIUM_PLANS[id].label[locale]}</span>
            <span className="block text-[12px] font-bold text-mystic-gold">{buying === id ? '…' : `${PREMIUM_PLANS[id].stars} ⭐`}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
