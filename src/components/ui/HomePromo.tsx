'use client';

/**
 * Card under the quote on the home screen.
 *  - new users (first 48 h): the one-time starter offer, 500 oracles for 99 ⭐
 *  - everyone else without premium: what premium gives, "from 499 ⭐"
 *  - premium users: status chip with days left, the savings counter and a
 *    renewal nudge in the last 3 days
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { PREMIUM_FROM_STARS, STARTER_OFFER } from '@/lib/shop';
import { startPurchase } from '@/lib/purchase';
import { daysLabel } from '@/lib/plural';
import ManaIcon from './ManaIcon';

type L = 'ru' | 'uk' | 'en';

const T = {
  starterTitle: { ru: 'Стартовый набор', uk: 'Стартовий набір', en: 'Starter pack' },
  starterText: {
    ru: `${STARTER_OFFER.mana} оракулов за ${STARTER_OFFER.stars} ⭐ — в 1,7 раза выгоднее обычного`,
    uk: `${STARTER_OFFER.mana} оракулів за ${STARTER_OFFER.stars} ⭐ — в 1,7 раза вигідніше звичайного`,
    en: `${STARTER_OFFER.mana} oracles for ${STARTER_OFFER.stars} ⭐ — 1.7× the usual value`,
  },
  starterLeft: { ru: 'Только для новых · осталось', uk: 'Лише для нових · залишилось', en: 'New users only · ends in' },
  starterBtn: { ru: `Забрать за ${STARTER_OFFER.stars} ⭐`, uk: `Забрати за ${STARTER_OFFER.stars} ⭐`, en: `Get for ${STARTER_OFFER.stars} ⭐` },
  premiumTitle: { ru: 'Premium — оракулы не тратятся', uk: 'Premium — оракули не витрачаються', en: 'Premium — oracles never run out' },
  premiumText: {
    ru: 'Все расклады бесплатно, натальная карта или матрица раз в месяц, золотое оформление',
    uk: 'Усі розклади безкоштовно, натальна карта або матриця раз на місяць, золоте оформлення',
    en: 'Every spread free, a natal chart or matrix monthly, gold theme',
  },
  premiumFrom: { ru: `от ${PREMIUM_FROM_STARS} ⭐ / мес`, uk: `від ${PREMIUM_FROM_STARS} ⭐ / міс`, en: `from ${PREMIUM_FROM_STARS} ⭐ / mo` },
  left: { ru: 'ещё', uk: 'ще', en: '' },
  leftEn: 'left',
  saved: { ru: 'Premium сэкономил тебе', uk: 'Premium заощадив тобі', en: 'Premium saved you' },
  savedZero: { ru: 'Каждый расклад теперь за 0', uk: 'Кожен розклад тепер за 0', en: 'Every reading now costs 0' },
  renew: { ru: 'Продлить', uk: 'Продовжити', en: 'Renew' },
};

function formatLeft(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function HomePromo() {
  const { user, locale, setScreen, patchUser, addMana } = useAppStore();
  const l = (locale || 'ru') as L;
  const [now, setNow] = useState(() => Date.now());
  const [buying, setBuying] = useState(false);

  const starterEnds = user?.starterOfferEndsAt ? new Date(user.starterOfferEndsAt).getTime() : 0;
  const starterLive = !user?.isPremium && starterEnds > now;

  useEffect(() => {
    if (!starterEnds) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [starterEnds]);

  if (!user) return null;

  // ─── Premium: status + savings ─────────────────────────────────────────────
  if (user.isPremium) {
    const days = user.premiumDaysLeft || 0;
    const saved = user.premiumSaved || 0;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl px-4 py-3 premium-card flex items-center gap-3"
      >
        <span className="text-2xl" aria-hidden>👑</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold premium-price">
            Premium · {l === 'en' ? `${daysLabel(days, l)} ${T.leftEn}` : `${T.left[l]} ${daysLabel(days, l)}`}
          </p>
          <p className="text-[11.5px] text-mystic-text/80 mt-0.5 flex items-center gap-1">
            {saved > 0 ? (
              <>
                {T.saved[l]} <b className="text-mystic-gold">{saved.toLocaleString('ru-RU')}</b> <ManaIcon size="sm" />
              </>
            ) : (
              T.savedZero[l]
            )}
          </p>
        </div>
        {days <= 3 && (
          <button
            onClick={() => setScreen('shop')}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold bg-gradient-to-r from-mystic-gold to-amber-500 text-mystic-bg"
          >
            {T.renew[l]}
          </button>
        )}
      </motion.div>
    );
  }

  // ─── New users: starter offer ──────────────────────────────────────────────
  if (starterLive) {
    const buy = async () => {
      if (buying) return;
      setBuying(true);
      const res = await startPurchase(STARTER_OFFER.id);
      setBuying(false);
      if (res.status === 'paid') {
        addMana(STARTER_OFFER.mana);
        patchUser({ starterOfferEndsAt: null });
      } else if (res.status === 'error') {
        (window as any).Telegram?.WebApp?.showAlert?.(res.error || 'Error');
      }
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl px-4 py-3 border border-emerald-300/30 bg-gradient-to-br from-emerald-400/10 via-mystic-card to-mystic-accent/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🎁</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-emerald-200">{T.starterTitle[l]}</p>
            <p className="text-[11.5px] text-mystic-text/85 leading-snug">{T.starterText[l]}</p>
            <p className="text-[10.5px] text-mystic-muted mt-0.5">
              {T.starterLeft[l]} <span className="tabular-nums">{formatLeft(starterEnds - now)}</span>
            </p>
          </div>
        </div>
        <button
          onClick={buy}
          disabled={buying}
          className="mt-2.5 w-full py-2 rounded-xl text-[13px] font-bold bg-gradient-to-r from-emerald-300 to-teal-400 text-mystic-bg disabled:opacity-60"
        >
          {buying ? '…' : T.starterBtn[l]}
        </button>
      </motion.div>
    );
  }

  // ─── Everyone else: what premium gives ─────────────────────────────────────
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      onClick={() => setScreen('shop')}
      className="w-full text-left rounded-2xl px-4 py-3 premium-card flex items-center gap-3"
    >
      <span className="text-2xl" aria-hidden>👑</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold premium-price">{T.premiumTitle[l]}</p>
        <p className="text-[11.5px] text-mystic-text/80 leading-snug mt-0.5">{T.premiumText[l]}</p>
        <p className="text-[11px] text-mystic-gold/90 mt-1 font-semibold">{T.premiumFrom[l]}</p>
      </div>
      <span className="text-mystic-gold text-xl" aria-hidden>→</span>
    </motion.button>
  );
}
