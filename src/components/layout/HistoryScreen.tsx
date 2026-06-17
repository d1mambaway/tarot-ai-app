'use client';

import { useAppStore } from '@/store/app-store';
import { getSpreadById } from '@/data/spreads';
import { motion } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'История', uk: 'Історія', en: 'History' },
  empty: { ru: 'Тут будут твои расклады', uk: 'Тут будуть твої розклади', en: 'Your readings will appear here' },
  first: { ru: 'Сделать первый расклад', uk: 'Зробити перший розклад', en: 'Start your first reading' },
};

const localeDateStr = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };

/** Resolve card name — DB stores {ru,uk,en} object, normalize to string */
function resolveCardName(name: any, l: L): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object') return name[l] || name.ru || name.en || '';
  return '';
}

export default function HistoryScreen() {
  const { readingHistory, locale, setCurrentReading, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;

  const openReading = (reading: typeof readingHistory[0]) => {
    const spread = getSpreadById(reading.spreadId);
    if (spread) useAppStore.getState().selectSpread(spread);
    setCurrentReading({ ...reading, alreadyDrawn: true } as any);
    setScreen('reading');
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">📜 {T.title[l]}</h1>

      {readingHistory.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-5xl mb-4 opacity-40">📜</div>
          <p className="text-mystic-muted text-sm">{T.empty[l]}</p>
          <button onClick={() => setScreen('home')}
            className="mt-4 px-6 py-2 rounded-xl bg-mystic-card border border-mystic-accent/20 text-mystic-accent text-sm">
            🔮 {T.first[l]}
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
              <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => openReading(reading)}
                className="w-full p-4 rounded-xl bg-mystic-card/80 border border-mystic-accent/15 text-left hover:border-mystic-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{spread?.icon || '🔮'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-mystic-text truncate">
                      {spread?.name[l]?.replace(/^[\\S]+\\s/, '') || reading.spreadId}
                    </p>
                    {reading.question && <p className="text-[11px] text-mystic-muted truncate mt-0.5">«{reading.question}»</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-mystic-muted">{dateStr}</p>
                    <p className="text-[10px] text-mystic-muted">{timeStr}</p>
                  </div>
                </div>
                {reading.cards.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {reading.cards.slice(0, 5).map((c, j) => (
                      <span key={j} className="text-[10px] bg-mystic-accent/10 text-mystic-accent px-1.5 py-0.5 rounded">
                        {resolveCardName(c.name, l)}{c.reversed ? ' ↩️' : ''}
                      </span>
                    ))}
                    {reading.cards.length > 5 && <span className="text-[10px] text-mystic-muted px-1">+{reading.cards.length - 5}</span>}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
