'use client';

/**
 * «Луна сегодня» — the hero block of the home screen.
 * Real moon with the exact phase, the cycle ring, the Moon's sign, lunar day
 * (Kyiv moonrise), countdown to the next new/full moon, what the day is good
 * for, a matching spread, and a personal line for the user's zodiac sign.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { getMoonInfoCached, daysUntil, kyivDay, type MoonInfo } from '@/lib/moon';
import { SIGN_KEYS, SIGN_GLYPHS, SIGN_NAMES, SIGN_IN } from '@/lib/zodiac';
import { daysLabel } from '@/lib/plural';
import { getSpreadById } from '@/data/spreads';
import { PHASE_TEXT, MOON_SIGN_TEXT, PERSONAL_TEXT, MOON_UI, personalKey } from '@/data/moon-texts';
import { hapticLight } from '@/lib/haptics';
import MoonDisc from './moon/MoonDisc';
import MoonCycleRing from './moon/MoonCycleRing';
import MoonDetailsSheet from './moon/MoonDetailsSheet';
import BirthDateCard from './moon/BirthDateCard';

type L = 'ru' | 'uk' | 'en';

/** Spread name without the leading emoji */
export function spreadTitle(id: string, l: L): string {
  const s = getSpreadById(id);
  if (!s) return '';
  return s.name[l].replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

export function lunarDayLabel(n: number, l: L): string {
  return l === 'en' ? `${MOON_UI.lunarDayEn}${n}` : `${n}${MOON_UI.lunarDay[l]}`;
}

export function nextEventLabel(m: MoonInfo, l: L): string {
  // «сегодня» only when the exact moment falls on today's date in Kyiv
  const today = kyivDay(m.computedAt);
  if (kyivDay(m.nextFull) === today) return MOON_UI.fullToday[l];
  if (kyivDay(m.nextNew) === today) return MOON_UI.newToday[l];
  const full = Math.max(1, daysUntil(m.nextFull, m.computedAt));
  const nw = Math.max(1, daysUntil(m.nextNew, m.computedAt));
  return m.nextFull < m.nextNew ? `${MOON_UI.fullIn[l]} ${daysLabel(full, l)}` : `${MOON_UI.newIn[l]} ${daysLabel(nw, l)}`;
}

export default function MoonPhaseWidget({ locale }: { locale: string }) {
  const l = (locale || 'ru') as L;
  const { user, selectSpread } = useAppStore();
  const [moon, setMoon] = useState<MoonInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [editBirth, setEditBirth] = useState(false);

  // Computed on the device after mount (no SSR mismatch), refreshed every 10 min
  useEffect(() => {
    const run = () => {
      try {
        setMoon(getMoonInfoCached(new Date()));
      } catch (e) {
        console.warn('moon calc failed', e);
      }
    };
    run();
    const t = setInterval(run, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const userSign = useMemo(() => {
    const k = user?.zodiacSign;
    const i = k ? SIGN_KEYS.indexOf(k as (typeof SIGN_KEYS)[number]) : -1;
    return i >= 0 ? i : null;
  }, [user?.zodiacSign]);

  if (!moon) {
    return <div className="mb-4 h-[330px] rounded-3xl moon-card animate-pulse" />;
  }

  const phase = PHASE_TEXT[moon.phase];
  const signText = MOON_SIGN_TEXT[moon.signIndex];
  const spreadId = phase.spread;
  const spread = getSpreadById(spreadId);

  const openSpread = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticLight();
    if (spread) selectSpread(spread);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-4 rounded-3xl moon-card overflow-hidden"
        role="button"
        tabIndex={0}
        onClick={() => {
          hapticLight();
          setOpen(true);
        }}
      >
        <div className="moon-card-stars" aria-hidden />
        <div className="relative px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            {/* Moon + cycle ring */}
            <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
              <MoonCycleRing phaseAngle={moon.phaseAngle} size={128} />
              <motion.div
                className="absolute inset-0 moon-float"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <MoonDisc phaseAngle={moon.phaseAngle} size={128} glow={moon.illumination / 100} />
              </motion.div>
            </div>

            {/* Headline facts */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#b9a7f0]/80">{MOON_UI.today[l]}</p>
              <h3 className="font-display text-[26px] leading-[1.05] font-semibold gold-foil mt-0.5">{phase.name[l]}</h3>
              <p className="mt-1.5 text-[13px] text-mystic-text/90">
                <span className="text-mystic-gold mr-1">{SIGN_GLYPHS[moon.signIndex]}</span>
                {MOON_UI.moonIn[l]} {SIGN_IN[l][moon.signIndex]}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="moon-chip">{moon.illumination}%</span>
                <span className="moon-chip">{lunarDayLabel(moon.lunarDay, l)}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-mystic-muted">{nextEventLabel(moon, l)}</p>
            </div>
          </div>

          <p className="mt-3 font-display italic text-[16px] leading-snug text-[#eadcb8]/90">{phase.vibe[l]}</p>

          <div className="moon-divider my-3" />

          <ul className="space-y-1.5 text-[12.5px] leading-snug">
            <li className="flex gap-2">
              <span className="text-emerald-300/80 shrink-0">✦</span>
              <span>
                <span className="text-mystic-muted">{MOON_UI.good[l]}: </span>
                <span className="text-mystic-text/90">{signText.good[l]}</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-300/80 shrink-0">✦</span>
              <span>
                <span className="text-mystic-muted">{MOON_UI.avoid[l]}: </span>
                <span className="text-mystic-text/90">{signText.avoid[l]}</span>
              </span>
            </li>
            {spread && (
              <li className="flex flex-wrap gap-x-2 gap-y-1 items-center">
                <span className="text-mystic-gold/90 shrink-0">✦</span>
                <span className="text-mystic-muted">{MOON_UI.spread[l]}:</span>
                <button onClick={openSpread} className="moon-spread-chip">
                  {spreadTitle(spreadId, l)}
                  <span aria-hidden>→</span>
                </button>
              </li>
            )}
          </ul>

          {/* Personal line or the birth-date request */}
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <AnimatePresence mode="wait">
              {userSign !== null && !editBirth ? (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl px-3 py-2.5 moon-personal"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-mystic-gold/80">
                      {SIGN_GLYPHS[userSign]} {MOON_UI.forYou[l]}, {SIGN_NAMES[l][userSign]}
                    </p>
                    <button
                      onClick={() => setEditBirth(true)}
                      className="text-[10px] text-mystic-muted/80 underline decoration-dotted underline-offset-2"
                    >
                      {MOON_UI.change[l]}
                    </button>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-mystic-text/95">
                    {PERSONAL_TEXT[personalKey(moon.signIndex, userSign)][l]}
                  </p>
                </motion.div>
              ) : (
                <BirthDateCard
                  key="ask"
                  locale={l}
                  initial={user?.birthDate || ''}
                  onSaved={() => setEditBirth(false)}
                  onCancel={editBirth ? () => setEditBirth(false) : undefined}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <MoonDetailsSheet open={open} onClose={() => setOpen(false)} moon={moon} locale={l} />
    </>
  );
}

