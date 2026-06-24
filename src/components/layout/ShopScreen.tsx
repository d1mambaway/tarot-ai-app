'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import ManaBalance from '@/components/ui/ManaBalance';

type L = 'ru' | 'uk' | 'en';

const MANA_PACKS = [
  { id: 'pack_500', mana: 500, stars: 500, label: { ru: 'Начало', uk: 'Початок', en: 'Starter' }, icon: '✨', color: 'from-mystic-blue/30 to-mystic-card' },
  { id: 'pack_1500', mana: 1500, stars: 1500, label: { ru: 'Стандарт', uk: 'Стандарт', en: 'Standard' }, icon: '💫', color: 'from-mystic-purple/30 to-mystic-card', popular: true },
  { id: 'pack_5000', mana: 5000, stars: 5000, label: { ru: 'Премиум', uk: 'Преміум', en: 'Premium' }, icon: '🔮', color: 'from-mystic-accent/20 to-mystic-card' },
  { id: 'pack_15000', mana: 15000, stars: 15000, label: { ru: 'Мега', uk: 'Мега', en: 'Mega' }, icon: '👑', color: 'from-mystic-gold/20 to-mystic-card', bonus: '+3000' },
];

const T = {
  title: { ru: 'Магазин оракулов', uk: 'Магазин оракулів', en: 'Oracle Shop' },
  sub: { ru: 'Покупай оракулы за Telegram Stars ⭐', uk: 'Купуй оракули за Telegram Stars ⭐', en: 'Buy oracles with Telegram Stars ⭐' },
  popular: { ru: 'ПОПУЛЯРНЫЙ', uk: 'ПОПУЛЯРНИЙ', en: 'POPULAR' },
};

export default function ShopScreen() {
  const { user, locale, addMana } = useAppStore();
  const l = (locale || 'ru') as L;
  const [buying, setBuying] = useState<string | null>(null);

  const handleBuy = async (packId: string, mana: number, stars: number) => {
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

      // Open native Telegram payment popup inside the Mini App
      tg.openInvoice(data.invoiceUrl, (status: string) => {
        if (status === 'paid') {
          addMana(mana);
          tg.HapticFeedback?.notificationOccurred('success');
        }
        setBuying(null);
      });
    } catch {
      tg.showAlert('Error creating invoice');
      setBuying(null);
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
                disabled={buying === pack.id}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${buying === pack.id ? 'opacity-50' : ''} ${pack.popular ? 'bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg' : 'bg-mystic-accent/20 border border-mystic-accent/30 text-mystic-accent'}`}>
                {buying === pack.id ? '...' : `${pack.stars} ⭐`}
              </button>
            </div>
          </motion.div>
        ))}
      </div>


    </div>
  );
}
