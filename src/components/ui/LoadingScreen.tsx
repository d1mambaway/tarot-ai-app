'use client';

/**
 * Loading screen — one design, three languages (ru / uk / en).
 *
 * Layers, back to front: night sky art with a slow push-in, a canvas of
 * twinkling stars and rising gold dust, a rotating zodiac ring, a floating
 * tarot card with a foil glint, the brand name in gold foil letters, and a
 * small moon that waxes from new to full as the app really loads.
 *
 * The language comes from the device (the last language chosen in the app),
 * then Telegram's language, then English.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoonDisc from '@/components/ui/moon/MoonDisc';
import { loadSavedLocale } from '@/store/app-store';
import { hapticLight } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const TEXT: Record<L, { brand: string; tagline: string; steps: string[] }> = {
  ru: {
    brand: 'Магия Карт',
    tagline: 'Таро • Астрология • Эзотерика',
    steps: ['Тасуем колоду…', 'Сверяемся с Луной…', 'Достаём твои расклады…', 'Зажигаем свечи…', 'Карты готовы'],
  },
  uk: {
    brand: 'Магія Карт',
    tagline: 'Таро • Астрологія • Езотерика',
    steps: ['Тасуємо колоду…', 'Звіряємося з Місяцем…', 'Дістаємо твої розклади…', 'Запалюємо свічки…', 'Карти готові'],
  },
  en: {
    brand: 'Magic of Cards',
    tagline: 'Tarot • Astrology • Esoterica',
    steps: ['Shuffling the deck…', 'Consulting the Moon…', 'Gathering your readings…', 'Lighting the candles…', 'The cards are ready'],
  },
};

function detectLang(): L {
  const saved = loadSavedLocale();
  if (saved) return saved;
  try {
    const lc = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (lc === 'uk') return 'uk';
    if (lc === 'ru' || lc === 'be') return 'ru';
  } catch {
    /* not in Telegram */
  }
  return 'en';
}

const GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

// ─── Canvas: twinkling stars + rising gold dust ─────────────────────────────

function useSkyCanvas(ref: React.RefObject<HTMLCanvasElement>, enabled: boolean) {
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !enabled) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Seeded so the layout doesn't jump between renders
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const stars = Array.from({ length: 70 }, () => ({
      x: rnd(), y: rnd() * 0.72, r: 0.4 + rnd() * 1.1, p: rnd() * Math.PI * 2, s: 0.6 + rnd() * 1.6,
    }));
    const dust = Array.from({ length: 34 }, () => ({
      x: rnd(), y: 0.35 + rnd() * 0.75, r: 0.6 + rnd() * 1.8, v: 0.012 + rnd() * 0.03, d: rnd() * Math.PI * 2, a: 0.25 + rnd() * 0.6,
    }));

    // One soft gold dot rendered once, then stamped with drawImage
    const sprite = document.createElement('canvas');
    const SP = 32;
    sprite.width = SP;
    sprite.height = SP;
    const sctx = sprite.getContext('2d');
    if (sctx) {
      const g = sctx.createRadialGradient(SP / 2, SP / 2, 0, SP / 2, SP / 2, SP / 2);
      g.addColorStop(0, 'rgba(255,222,150,1)');
      g.addColorStop(0.35, 'rgba(255,210,130,0.45)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SP, SP);
    }

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * st.s + st.p));
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = '#fff6e0';
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of dust) {
        p.y -= p.v * dt * 1.6;
        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = rnd();
        }
        const x = (p.x + Math.sin(t * 0.6 + p.d) * 0.012) * w;
        const y = p.y * h;
        const fade = Math.min(1, (1.05 - p.y) * 3) * Math.min(1, p.y * 4);
        const s = p.r * 6;
        ctx.globalAlpha = Math.max(0, p.a * fade);
        ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [ref, enabled]);
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  /** 0..1, real loading progress */
  progress?: number;
  /** true when the app is ready: plays the exit and then calls onExited */
  leaving?: boolean;
  onExited?: () => void;
}

export default function LoadingScreen({ progress = 0.1, leaving = false, onExited }: Props) {
  const [lang, setLang] = useState<L | null>(null);
  const [reduced, setReduced] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setLang(detectLang());
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  useSkyCanvas(canvasRef, lang !== null && !reduced);

  useEffect(() => {
    if (!leaving) return;
    hapticLight();
    const t = setTimeout(() => onExited?.(), 750);
    return () => clearTimeout(t);
  }, [leaving, onExited]);

  const t = TEXT[lang ?? 'ru'];
  const p = Math.max(0, Math.min(1, leaving ? 1 : progress));
  // Real progress points from page.tsx: 0.25 Telegram ready, 0.6 profile, 0.8 history
  const step = leaving ? 4 : p < 0.2 ? 0 : p < 0.55 ? 1 : p < 0.75 ? 2 : 3;

  return (
    <motion.div
      className="fixed inset-0 z-[300] overflow-hidden splash-root"
      initial={false}
      animate={leaving ? { opacity: 0, scale: 1.06 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: leaving ? 0.05 : 0 }}
      aria-busy={!leaving}
    >
      {/* Sky art with a slow push-in */}
      <div className="absolute inset-0 splash-bg" aria-hidden />

      {/* Stars and gold dust */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />

      {/* Card + zodiac ring */}
      <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <div className="splash-ring">
          <svg viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="138" fill="none" stroke="rgba(243,220,160,0.28)" strokeWidth="0.8" />
            <circle cx="150" cy="150" r="112" fill="none" stroke="rgba(243,220,160,0.14)" strokeWidth="0.6" />
            <circle cx="150" cy="150" r="146" fill="none" stroke="rgba(243,220,160,0.12)" strokeWidth="0.5" strokeDasharray="1 5" />
            {GLYPHS.map((g, i) => {
              // Rounded: server and browser format long floats differently (hydration warning)
              const r2 = (v: number) => Math.round(v * 100) / 100;
              const a = ((i * 30 - 90) * Math.PI) / 180;
              const b = ((i * 30 - 75) * Math.PI) / 180;
              return (
                <g key={g}>
                  <line
                    x1={r2(150 + Math.cos(a) * 112)}
                    y1={r2(150 + Math.sin(a) * 112)}
                    x2={r2(150 + Math.cos(a) * 138)}
                    y2={r2(150 + Math.sin(a) * 138)}
                    stroke="rgba(243,220,160,0.22)"
                    strokeWidth="0.6"
                  />
                  <text
                    x={r2(150 + Math.cos(b) * 125)}
                    y={r2(150 + Math.sin(b) * 125)}
                    fill="rgba(243,220,160,0.5)"
                    fontSize="12"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {g + '︎'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="splash-card-glow" />
        <motion.div
          className="splash-card-wrap"
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={leaving ? { opacity: 0, y: -10, scale: 1.18 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: leaving ? 0.6 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="splash-card-float">
            <div className="splash-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ui/card-back.webp" alt="" draggable={false} />
              <div className="splash-card-glint" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Brand */}
      <div className="absolute left-0 right-0 top-[60%] flex flex-col items-center px-6 text-center">
        <AnimatePresence>
          {lang && (
            <motion.h1
              key={lang}
              className="font-display font-semibold text-[clamp(34px,11.2vw,44px)] leading-none tracking-[0.01em]"
              initial="hidden"
              animate={leaving ? 'gone' : 'shown'}
              variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.045, delayChildren: 0.35 } }, gone: {} }}
            >
              {t.brand.split(' ').map((word, wi, arr) => (
                <span key={wi} className="inline-block whitespace-nowrap">
                  {word.split('').map((ch, i) => (
                    <motion.span
                      key={i}
                      className="inline-block gold-foil"
                      variants={{
                        hidden: { opacity: 0, y: 10, filter: 'blur(8px)' },
                        shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                        gone: { opacity: 0, y: -8, transition: { duration: 0.4 } },
                      }}
                    >
                      {ch}
                    </motion.span>
                  ))}
                  {wi < arr.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </motion.h1>
          )}
        </AnimatePresence>
        {lang && (
          <motion.p
            className="mt-3 whitespace-nowrap text-[clamp(9px,2.8vw,11px)] uppercase tracking-[0.26em] text-[#d9c89c]/80"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: leaving ? 0 : 1, y: 0 }}
            transition={{ delay: leaving ? 0 : 1.0, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.tagline}
          </motion.p>
        )}
        <motion.div
          className="mt-4 h-px w-40 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: leaving ? 0 : 1 }}
          transition={{ delay: 1.2, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Moon progress + status */}
      <div className="absolute left-0 right-0 bottom-[9%] flex flex-col items-center gap-2.5" aria-live="polite">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <MoonDisc phaseAngle={Math.max(8, p * 180)} size={58} glow={p} />
        </motion.div>
        <AnimatePresence mode="wait">
          {lang && (
            <motion.p
              key={`${lang}-${step}`}
              className="text-[12px] tracking-[0.14em] text-[#e8dcc0]/75"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {t.steps[step]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
