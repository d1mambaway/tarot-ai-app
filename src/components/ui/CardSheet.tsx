'use client';

/**
 * Bottom sheet for one collected card: art, arcana
 * label, keywords, upright / reversed meaning, how often it was drawn.
 */

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import type { TarotCard } from '@/data/tarot-cards';
import { ROMAN } from '@/data/constellations';
import { assetUrl } from '@/lib/assets';
import { hapticLight } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const T = {
  major: { ru: 'Старший аркан', uk: 'Старший аркан', en: 'Major Arcana' },
  suits: {
    wands: { ru: 'Жезлы', uk: 'Жезли', en: 'Wands' },
    cups: { ru: 'Кубки', uk: 'Кубки', en: 'Cups' },
    swords: { ru: 'Мечи', uk: 'Мечі', en: 'Swords' },
    pentacles: { ru: 'Пентакли', uk: 'Пентаклі', en: 'Pentacles' },
  } as Record<string, Record<L, string>>,
  upright: { ru: 'Прямо', uk: 'Прямо', en: 'Upright' },
  reversed: { ru: 'Перевёрнуто', uk: 'Перевернуто', en: 'Reversed' },
  times: { ru: 'Выпадала', uk: 'Випадала', en: 'Drawn' },
  first: { ru: 'Впервые', uk: 'Вперше', en: 'First' },
  share: { ru: 'Поделиться', uk: 'Поділитися', en: 'Share' },
  reading: { ru: 'Сделать расклад', uk: 'Зробити розклад', en: 'Start a reading' },
  shareText: { ru: 'Моя карта в Магии Карт', uk: 'Моя карта в Магії Карт', en: 'My card in Magic of Cards' },
};

const RANKS: Record<L, string[]> = {
  ru: ['Туз', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Паж', 'Рыцарь', 'Королева', 'Король'],
  uk: ['Туз', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Паж', 'Лицар', 'Королева', 'Король'],
  en: ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Page', 'Knight', 'Queen', 'King'],
};

/** Keywords in the viewer's language (minor cards may lack English) */
function kw(k: Partial<Record<L, string[]>>, l: L): string[] {
  return k[l] ?? k.ru ?? [];
}

/** «раз / раза», «time / times» */
function timesWord(n: number, l: L): string {
  if (l === 'en') return n === 1 ? 'time' : 'times';
  const d = n % 10, h = n % 100;
  const few = d >= 2 && d <= 4 && (h < 12 || h > 14);
  return few ? (l === 'uk' ? 'рази' : 'раза') : 'раз';
}

export function cardLabel(card: TarotCard, l: L): string {
  if (card.arcana === 'major') return `${T.major[l]} · ${ROMAN[card.id]}`;
  const rank = RANKS[l][((card.number ?? 1) - 1) % 14] ?? '';
  return `${T.suits[card.suit ?? 'wands'][l]} · ${rank}`;
}

export default function CardSheet({
  card,
  times,
  firstAt,
  locale: l,
  onClose,
  onReading,
}: {
  card: TarotCard | null;
  times?: number;
  firstAt?: string;
  locale: L;
  onClose: () => void;
  onReading: () => void;
}) {
  const share = () => {
    if (!card) return;
    hapticLight();
    const tg = (window as any).Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id;
    const bot = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'cardsofmagic_bot';
    const link = userId ? `https://t.me/${bot}?start=ref_${userId}` : `https://t.me/${bot}`;
    const text = `${T.shareText[l]}: ${card.name[l]} ✨`;
    tg?.openTelegramLink?.(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  };

  const date = firstAt
    ? new Date(firstAt).toLocaleDateString(l === 'uk' ? 'uk-UA' : l === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long' })
    : null;

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {card && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[100] bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute left-0 right-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[24px] bg-night-800 border-t border-mystic-gold/30 px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col items-center gap-3.5"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 90) onClose(); }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-ink-2/35" />

            <div className="relative w-[176px] aspect-[2/3] rounded-[14px] overflow-hidden border border-mystic-gold/45 shadow-[0_0_36px_rgba(212,175,55,0.22)]">
              <Image src={assetUrl(card.image)} alt={card.name[l]} fill className="object-cover" unoptimized />
            </div>

            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="t-overline !text-lavender">{cardLabel(card, l)}</span>
              <h2 className="t-screen">{card.name[l]}</h2>
            </div>


            <div className="w-full grid grid-cols-2 gap-2">
              <div className="rounded-[14px] bg-night-700 px-3 py-2.5 flex flex-col gap-1">
                <span className="t-overline">{T.upright[l]}</span>
                <span className="text-sm text-ink">{kw(card.keywords, l).join(', ')}</span>
              </div>
              <div className="rounded-[14px] bg-night-700 px-3 py-2.5 flex flex-col gap-1">
                <span className="t-overline">{T.reversed[l]}</span>
                <span className="text-sm text-ink">{kw(card.reversedKeywords, l).join(', ')}</span>
              </div>
            </div>

            {(times || date) && (
              <div className="w-full flex justify-between text-sm text-ink-2">
                {times ? <span>{T.times[l]} {times} {timesWord(times, l)}</span> : <span />}
                {date && <span>{T.first[l]} {date}</span>}
              </div>
            )}

            <div className="w-full grid grid-cols-2 gap-2 pt-1">
              <button onClick={share} className="h-12 btn-secondary text-base">{T.share[l]}</button>
              <button onClick={onReading} className="h-12 btn-primary text-base">{T.reading[l]}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
