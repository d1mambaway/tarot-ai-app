'use client';

import { useAppStore } from '@/store/app-store';
import { SPREADS, type SpreadCategory } from '@/data/spreads';
import { motion } from 'framer-motion';
import ManaIcon from '@/components/ui/ManaIcon';
import CardOfDaySection from '@/components/ui/CardOfDaySection';

type L = 'ru' | 'uk' | 'en';

const T = {
  tarot: { ru: 'Таро и расклады', uk: 'Таро та розклади', en: 'Tarot & Spreads' },
  esoteric: { ru: 'Эзотерика', uk: 'Езотерика', en: 'Esoteric' },
  start: { ru: 'Начать', uk: 'Почати', en: 'Start' },
  free: { ru: 'Бесплатно', uk: 'Безкоштовно', en: 'Free' },
};

// ─── Aura glow colors per spread (RGB) — matched to header image palettes ──

const SPREAD_AURA: Record<string, string> = {
  // Tarot
  yes_no:              '70,140,200',    // mystic blue (card + green/red accents)
  past_present_future: '210,180,80',    // warm gold (golden light flows)
  relationship:        '220,60,130',    // hot pink (hearts, magenta glow)
  what_they_think:     '140,60,210',    // deep purple (third-eye, indigo)
  career_money:        '170,190,50',    // gold-green (coins, green energy)
  celtic_cross:        '160,100,230',   // violet (galaxies, purple crystals)
  weekly:              '60,200,160',    // teal-green (rainbow center)
  monthly:             '140,140,230',   // soft lavender (moon phases, silver)
  free_question:       '80,220,210',    // cyan-teal (iridescent rainbow)
  // Esoteric
  compatibility:       '210,50,100',    // crimson rose (pink hearts, zodiac)
  horoscope:           '150,80,230',    // rich purple (zodiac wheel)
  numerology:          '210,185,60',    // pure gold (golden number)
  runes:               '200,155,70',    // warm amber (golden rune symbol)
  dream:               '170,150,220',   // dreamy lavender (dreamcatcher)
  angel_numbers:       '220,210,150',   // celestial white-gold (wings)
  moon_phase:          '100,120,230',   // cosmic blue-purple (moon glow)
  past_lives:          '175,115,210',   // purple-gold (hourglass, ancient)
  chakra:              '80,210,120',    // heart-chakra green (rainbow center)
};

function getAuraStyle(spreadId: string) {
  const rgb = SPREAD_AURA[spreadId];
  if (!rgb) return {};
  return {
    boxShadow: `0 0 12px rgba(${rgb},0.3), 0 0 28px rgba(${rgb},0.15), inset 0 0 12px rgba(${rgb},0.05)`,
    borderColor: `rgba(${rgb},0.45)`,
  };
}

export default function SpreadListScreen({ category }: { category: SpreadCategory }) {
  const { locale, selectSpread } = useAppStore();
  const l = (locale || 'ru') as L;
  const filtered = SPREADS.filter((s) => s.category === category && s.id !== 'card_of_day');
  const title = category === 'tarot' ? T.tarot[l] : T.esoteric[l];

  const headerImage =
    category === 'tarot' ? '/ui/tarot-header.webp' : '/ui/esoteric-header.webp';

  // Only show Card of Day in the tarot tab
  const showCardOfDay = category === 'tarot';

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Category header image — half size */}
      <div className="mb-4 rounded-2xl overflow-hidden">
        <img src={headerImage} alt={title} className="w-full h-auto block" style={{ maxHeight: '80px', objectFit: 'cover' }} />
      </div>

      <h1 className="text-xl font-bold font-mystic text-gradient-gold mb-4">{title}</h1>

      {/* Card of Day — identical to HomeScreen */}
      {showCardOfDay && <CardOfDaySection />}

      {/* Other spreads */}
      <div className="space-y-3">
        {filtered.map((spread, i) => (
          <motion.div
            key={spread.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (showCardOfDay ? 0.1 : 0) + i * 0.04, duration: 0.3 }}
            onClick={() => selectSpread(spread)}
            className="bg-mystic-card/80 rounded-2xl border overflow-hidden
                       active:scale-[0.98] transition-transform cursor-pointer"
            style={getAuraStyle(spread.id)}
          >
            {/* Image */}
            {spread.image ? (
              <img
                src={spread.image}
                alt=""
                className="w-full h-auto block"
                loading={i < 4 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="py-8 text-center text-4xl">{spread.icon}</div>
            )}

            {/* Info bar */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-mystic-text truncate">
                  {spread.name[l]}
                </p>
                <p className="text-[11px] text-mystic-muted mt-0.5 line-clamp-1">
                  {spread.description[l]}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {spread.manaCost > 0 ? (
                  <span className="text-xs font-bold text-mystic-accent flex items-center gap-1">
                    {spread.manaCost} <ManaIcon size="sm" />
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-green-400">{T.free[l]}</span>
                )}

                <span
                  className="px-3 py-1.5 rounded-xl bg-mystic-accent/15 border border-mystic-accent/25
                                 text-xs font-bold text-mystic-accent"
                >
                  {T.start[l]}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
