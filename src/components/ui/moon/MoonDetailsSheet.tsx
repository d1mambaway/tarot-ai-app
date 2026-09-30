'use client';

/**
 * Bottom sheet with the full lunar picture for today: big moon, the meaning
 * of the phase and of the Moon's sign, key times (Kyiv) and a moon reading.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { MoonInfo } from '@/lib/moon';
import { SIGN_GLYPHS, SIGN_IN } from '@/lib/zodiac';
import { getSpreadById } from '@/data/spreads';
import { PHASE_TEXT, MOON_SIGN_TEXT, MOON_UI } from '@/data/moon-texts';
import { hapticLight } from '@/lib/haptics';
import MoonDisc from './MoonDisc';

type L = 'ru' | 'uk' | 'en';

const INTL: Record<L, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-GB' };

// 'Europe/Kiev' is the id every engine knows ('Europe/Kyiv' throws on older
// WebViews). Formatters are cached; if the zone is unsupported we fall back
// to the device time zone instead of crashing.
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(l: L, opts: Intl.DateTimeFormatOptions, key: string): Intl.DateTimeFormat {
  const k = `${l}-${key}`;
  let f = fmtCache.get(k);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(INTL[l], { ...opts, timeZone: 'Europe/Kiev' });
    } catch {
      f = new Intl.DateTimeFormat(INTL[l], opts);
    }
    fmtCache.set(k, f);
  }
  return f;
}
function fmtDateTime(d: Date, l: L) {
  const date = formatter(l, { day: 'numeric', month: 'long' }, 'd').format(d);
  const time = formatter(l, { hour: '2-digit', minute: '2-digit' }, 't').format(d);
  return `${date}, ${time}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  moon: MoonInfo;
  locale: L;
}

export default function MoonDetailsSheet({ open, onClose, moon, locale }: Props) {
  const l = locale;
  const { selectSpread } = useAppStore();
  const phase = PHASE_TEXT[moon.phase];
  const sign = MOON_SIGN_TEXT[moon.signIndex];
  const nextSign = (moon.signIndex + 1) % 12;
  const moonSpread = getSpreadById('moon_phase');
  // Rendered into <body>: the home screen is its own stacking context (z-10),
  // so without a portal the bottom navigation would cover the sheet
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock page scroll while the sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dragControls = useDragControls();
  const rows: [string, string][] = !open ? [] : [
    [MOON_UI.dayStarted[l], `${fmtDateTime(moon.lunarDayStart, l)} (${MOON_UI.kyiv[l]})`],
    [`${MOON_UI.signChange[l]} ${SIGN_GLYPHS[nextSign]} ${SIGN_IN[l][nextSign]}`, fmtDateTime(moon.signChangeAt, l)],
    [MOON_UI.nextFull[l], fmtDateTime(moon.nextFull, l)],
    [MOON_UI.nextNew[l], fmtDateTime(moon.nextNew, l)],
  ];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[28px] moon-sheet px-5 pt-3 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            // Drag starts only from the handle, so the sheet itself scrolls normally
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="-mx-5 -mt-3 mb-1 pt-3 pb-2 flex justify-center cursor-grab touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1 w-10 rounded-full bg-white/25" />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="relative moon-float" style={{ width: 230, height: 230 }}>
                <MoonDisc phaseAngle={moon.phaseAngle} size={230} glow={moon.illumination / 100} />
              </div>
              <h2 className="-mt-3 font-display text-3xl leading-none font-semibold gold-foil">{phase.name[l]}</h2>
              <p className="mt-2 text-sm text-mystic-text/85">
                <span className="text-mystic-gold mr-1">{SIGN_GLYPHS[moon.signIndex]}</span>
                {MOON_UI.moonIn[l]} {SIGN_IN[l][moon.signIndex]} · {moon.illumination}%
              </p>
            </div>

            <p className="mt-5 font-display italic text-xl leading-snug text-[#eadcb8] text-center">{phase.vibe[l]}</p>
            <p className="mt-3 text-sm leading-relaxed text-mystic-text/85">{phase.long[l]}</p>

            <div className="moon-divider my-4" />

            <p className="text-sm leading-relaxed text-mystic-text/85">
              <span className="text-mystic-gold">{SIGN_GLYPHS[moon.signIndex]} </span>
              {sign.mood[l]}.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl px-3 py-2.5 bg-emerald-400/[0.06] border border-emerald-300/15">
                <p className="text-emerald-400 text-micro uppercase tracking-[0.16em]">{MOON_UI.good[l]}</p>
                <p className="mt-1 text-mystic-text/90 leading-snug">{sign.good[l]}</p>
              </div>
              <div className="rounded-2xl px-3 py-2.5 bg-rose-400/[0.06] border border-rose-300/15">
                <p className="text-red-400 text-micro uppercase tracking-[0.16em]">{MOON_UI.avoid[l]}</p>
                <p className="mt-1 text-mystic-text/90 leading-snug">{sign.avoid[l]}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-mystic-gold/15 bg-black/20 divide-y divide-white/5">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs">
                  <span className="text-mystic-muted">{k}</span>
                  <span className="text-mystic-text/90 text-right">{v}</span>
                </div>
              ))}
            </div>

            {moonSpread && (
              <button
                className="mt-5 w-full moon-gold-btn h-12 text-base"
                onClick={() => {
                  hapticLight();
                  onClose();
                  selectSpread(moonSpread);
                }}
              >
                ☾ {MOON_UI.moonReading[l]}
              </button>
            )}
            <button onClick={onClose} className="mt-3 w-full h-10 text-sm text-mystic-muted">
              {MOON_UI.close[l]}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
