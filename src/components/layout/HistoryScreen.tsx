'use client';

import { ScrollText, Sparkles } from 'lucide-react';
import { Icon, IconBadge } from '@/components/ui/Icon';
import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { getSpreadById } from '@/data/spreads';
import { motion } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'История', uk: 'Історія', en: 'History' },
  empty: { ru: 'Тут будут твои расклады', uk: 'Тут будуть твої розклади', en: 'Your readings will appear here' },
  first: { ru: 'Сделать первый расклад', uk: 'Зробити перший розклад', en: 'Start your first reading' },
  total: { ru: 'Всего раскладов', uk: 'Усього розкладів', en: 'Total readings' },
  more: { ru: 'Показать более ранние', uk: 'Показати раніші', en: 'Show earlier' },
  notePlaceholder: { ru: 'Добавь заметку к раскладу...', uk: 'Додай нотатку до розкладу...', en: 'Add a note to this reading...' },
};

const localeDateStr = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };

/** Resolve card name — DB stores {ru,uk,en} object, normalize to string */
function resolveCardName(name: any, l: L): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object') return name[l] || name.ru || name.en || '';
  return '';
}


// ─── Journal Notes (localStorage) ───────────────────────────────────────────


export default function HistoryScreen() {
  const { readingHistory, locale, setCurrentReading, setScreen, user, appendHistory } = useAppStore();
  const l = (locale || 'ru') as L;
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const total = Math.max(user?.readingsCount ?? 0, readingHistory.length);
  const hasMore = !exhausted && readingHistory.length < total;

  // History comes in pages of 100 — load the next, older page
  const loadMore = async () => {
    const tg = (window as any).Telegram?.WebApp;
    const oldest = readingHistory[readingHistory.length - 1]?.createdAt;
    if (!tg?.initData || !oldest || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reading?initData=${encodeURIComponent(tg.initData)}&before=${encodeURIComponent(oldest)}`);
      const data = await res.json();
      if (Array.isArray(data.readings)) appendHistory(data.readings);
      if (!data.hasMore) setExhausted(true);
    } catch {
      /* keep the button; the user can retry */
    } finally {
      setLoading(false);
    }
  };

  const openReading = (reading: typeof readingHistory[0]) => {
    const spread = getSpreadById(reading.spreadId);
    if (spread) useAppStore.getState().selectSpread(spread);
    setCurrentReading({ ...reading, alreadyDrawn: true } as any);
    setScreen('reading');
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="t-screen mb-1">{T.title[l]}</h1>
      {total > 0 && <p className="text-sm text-ink-2 mb-4">{T.total[l]}: {total}</p>}

      {readingHistory.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="flex justify-center mb-4 opacity-60"><Icon icon={ScrollText} size={44} /></div>
          <p className="text-mystic-muted text-sm">{T.empty[l]}</p>
          <button onClick={() => setScreen('home')}
            className="mt-4 px-6 py-2 rounded-xl bg-mystic-card border border-mystic-accent/20 text-mystic-accent text-sm">
            <span className="inline-flex items-center gap-1.5"><Icon icon={Sparkles} size={15} /> {T.first[l]}</span>
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {readingHistory.map((reading, i) => {
            const spread = getSpreadById(reading.spreadId);
            const date = new Date(reading.createdAt);
            const ldt = localeDateStr[l];
            const timeStr = date.toLocaleTimeString(ldt, { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString(ldt, { day: 'numeric', month: 'short' });

            return (
              <motion.button key={reading.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}
                onClick={() => openReading(reading)}
                className="w-full p-4 brand-card text-left">
                <div className="flex items-center gap-3">
                  {spread?.image ? (
                    <img src={spread.image} alt="" className="w-11 h-11 rounded-xl object-cover border border-mystic-gold/25 shrink-0" loading="lazy" />
                  ) : (
                    <IconBadge icon={Sparkles} size={44} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-mystic-text truncate">
                      {spread?.name[l]?.replace(/^[^\p{L}\p{N}]+/u, '').trim() || reading.spreadId}
                    </p>
                    {reading.question && <p className="text-micro text-mystic-muted truncate mt-0.5">«{reading.question}»</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-micro text-mystic-muted">{dateStr}</p>
                    <p className="text-micro text-mystic-muted">{timeStr}</p>
                  </div>
                </div>
                {reading.cards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {reading.cards.slice(0, 5).map((c, j) => (
                      <span key={j} className="text-micro bg-mystic-accent/10 text-mystic-accent px-1.5 py-0.5 rounded">
                        {resolveCardName(c.name, l)}{c.reversed ? ' ↺' : ''}
                      </span>
                    ))}
                    {reading.cards.length > 5 && <span className="text-micro text-mystic-muted px-1">+{reading.cards.length - 5}</span>}
                  </div>
                )}
              </motion.button>
            );
          })}
          {hasMore && (
            <button onClick={loadMore} disabled={loading} className="w-full py-3 btn-secondary text-sm disabled:opacity-60">
              {loading ? '…' : T.more[l]}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
