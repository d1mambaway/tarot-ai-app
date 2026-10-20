'use client';

import { useEffect, useMemo, useRef } from 'react';

type L = 'ru' | 'uk' | 'en';

interface NatalChartWheelProps {
  planets: Record<string, number[]>;
  cusps: number[];
  width?: number;
  locale?: L;
}

const SIGNS: Record<L, string[]> = {
  ru: ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'],
  uk: ['Овен', 'Телець', 'Близнюки', 'Рак', 'Лев', 'Діва', 'Терези', 'Скорпіон', 'Стрілець', 'Козеріг', 'Водолій', 'Риби'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
};

const PLANETS: { key: string; glyph: string; name: Record<L, string> }[] = [
  { key: 'Sun', glyph: '☉', name: { ru: 'Солнце', uk: 'Сонце', en: 'Sun' } },
  { key: 'Moon', glyph: '☽', name: { ru: 'Луна', uk: 'Місяць', en: 'Moon' } },
  { key: 'Mercury', glyph: '☿', name: { ru: 'Меркурий', uk: 'Меркурій', en: 'Mercury' } },
  { key: 'Venus', glyph: '♀', name: { ru: 'Венера', uk: 'Венера', en: 'Venus' } },
  { key: 'Mars', glyph: '♂', name: { ru: 'Марс', uk: 'Марс', en: 'Mars' } },
  { key: 'Jupiter', glyph: '♃', name: { ru: 'Юпитер', uk: 'Юпітер', en: 'Jupiter' } },
  { key: 'Saturn', glyph: '♄', name: { ru: 'Сатурн', uk: 'Сатурн', en: 'Saturn' } },
  { key: 'Uranus', glyph: '♅', name: { ru: 'Уран', uk: 'Уран', en: 'Uranus' } },
  { key: 'Neptune', glyph: '♆', name: { ru: 'Нептун', uk: 'Нептун', en: 'Neptune' } },
  { key: 'Pluto', glyph: '♇', name: { ru: 'Плутон', uk: 'Плутон', en: 'Pluto' } },
  { key: 'Chiron', glyph: '⚷', name: { ru: 'Хирон', uk: 'Хірон', en: 'Chiron' } },
];

const T = {
  title: { ru: 'Натальная карта', uk: 'Натальна карта', en: 'Natal chart' },
  asc: { ru: 'Асцендент', uk: 'Асцендент', en: 'Ascendant' },
  mc: { ru: 'Середина неба', uk: 'Середина неба', en: 'Midheaven' },
  house: { ru: 'дом', uk: 'дім', en: 'house' },
  harmony: { ru: 'гармония', uk: 'гармонія', en: 'harmony' },
  tension: { ru: 'напряжение', uk: 'напруга', en: 'tension' },
};

/** Muted element tints so the ring sits in the gold/night palette */
const FIRE = '#5b2c2a';
const EARTH = '#33402c';
const AIR = '#34345e';
const WATER = '#1f4150';
const SIGN_TINTS = [FIRE, EARTH, AIR, WATER, FIRE, EARTH, AIR, WATER, FIRE, EARTH, AIR, WATER];

const HARMONY = '#a99bf0';
const TENSION = '#e07a8f';

function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** "Близнецы 22°55′" */
function formatPosition(deg: number, l: L): string {
  const d = norm(deg);
  const sign = Math.floor(d / 30);
  const inSign = d - sign * 30;
  let whole = Math.floor(inSign);
  let minutes = Math.round((inSign - whole) * 60);
  if (minutes === 60) {
    whole += 1;
    minutes = 0;
  }
  return `${SIGNS[l][sign]} ${whole}°${String(minutes).padStart(2, '0')}′`;
}

const ASPECTS = [
  { name: 'sextile', degree: 60, orbit: 6, color: HARMONY },
  { name: 'square', degree: 90, orbit: 8, color: TENSION },
  { name: 'trine', degree: 120, orbit: 8, color: HARMONY },
  { name: 'opposition', degree: 180, orbit: 10, color: TENSION },
];

/**
 * Major aspects in the shape astrochart's radix.aspects() takes. Computed here
 * because the library ignores the ASPECTS setting for radix charts (it always
 * uses its own red/green defaults and skips sextiles).
 */
export function computeAspects(planets: Record<string, number[]>) {
  const names = Object.keys(planets);
  const out = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = planets[names[i]][0];
      const b = planets[names[j]][0];
      let gap = Math.abs(norm(a) - norm(b));
      if (gap > 180) gap = 360 - gap;
      for (const asp of ASPECTS) {
        // orbit is the full width of the window, like in astrochart
        const off = Math.abs(gap - asp.degree);
        if (off <= asp.orbit / 2) {
          out.push({
            aspect: { name: asp.name, degree: asp.degree, orbit: asp.orbit, color: asp.color },
            point: { name: names[i], position: a },
            toPoint: { name: names[j], position: b },
            precision: off.toFixed(4),
          });
        }
      }
    }
  }
  return out;
}

/** House number (1-12) for an ecliptic longitude, given the 12 house cusps */
export function houseOf(deg: number, cusps: number[]): number {
  const d = norm(deg);
  for (let i = 0; i < 12; i++) {
    const start = norm(cusps[i]);
    const span = norm(cusps[(i + 1) % 12] - start);
    if (norm(d - start) < span) return i + 1;
  }
  return 1;
}

/**
 * Renders the natal chart wheel with @astrodraw/astrochart plus a readable
 * list of planet positions underneath.
 * All data is pre-calculated server-side; this just visualizes it.
 */
export default function NatalChartWheel({ planets, cusps, width = 400, locale = 'ru' }: NatalChartWheelProps) {
  const l = locale;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import to avoid SSR issues (library needs DOM)
    import('@astrodraw/astrochart').then(({ default: Chart }) => {
      const el = containerRef.current;
      if (!el) return;

      // Clear previous render
      el.innerHTML = '';

      const chartId = `natal-chart-${Date.now()}`;
      const wrapper = document.createElement('div');
      wrapper.id = chartId;
      el.appendChild(wrapper);

      const chart = new Chart(chartId, width, width, {
        COLORS_SIGNS: SIGN_TINTS,
        SIGNS_COLOR: '#e9c97a',
        SIGNS_STROKE: 1.5,
        MARGIN: 32,
        PADDING: 14,
        SYMBOL_SCALE: 0.85,
        COLOR_BACKGROUND: 'transparent',
        POINTS_COLOR: '#f3dca0',
        POINTS_STROKE: 1.6,
        POINTS_TEXT_SIZE: 8,
        CUSPS_FONT_COLOR: 'rgba(212, 175, 55, 0.55)',
        SYMBOL_AXIS_FONT_COLOR: 'rgba(233, 201, 122, 0.8)',
        LINE_COLOR: 'rgba(212, 175, 55, 0.22)',
        CIRCLE_COLOR: 'rgba(212, 175, 55, 0.4)',
        SHOW_DIGNITIES_TEXT: false,
      });

      const radix = chart.radix({ planets, cusps });
      radix.aspects(computeAspects(planets));

      // Style the SVG to fit container
      const svg = el.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxWidth = `${width}px`;
      }
    });
  }, [planets, cusps, width]);

  const rows = useMemo(
    () =>
      PLANETS.filter((p) => typeof planets[p.key]?.[0] === 'number').map((p) => {
        const deg = planets[p.key][0];
        return { ...p, position: formatPosition(deg, l), house: houseOf(deg, cusps) };
      }),
    [planets, cusps, l],
  );

  return (
    <div className="flex flex-col items-center">
      <p className="t-overline mb-2">✦ {T.title[l]} ✦</p>
      <div ref={containerRef} className="w-full flex justify-center" style={{ maxWidth: width }} />

      {/* Aspect colours */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-mystic-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: HARMONY }} />
          {T.harmony[l]}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: TENSION }} />
          {T.tension[l]}
        </span>
      </div>

      {cusps.length === 12 && (
        <div className="w-full grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-xl bg-mystic-bg/40 border border-mystic-accent/15 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-mystic-muted">{T.asc[l]}</p>
            <p className="text-sm text-mystic-text">{formatPosition(cusps[0], l)}</p>
          </div>
          <div className="rounded-xl bg-mystic-bg/40 border border-mystic-accent/15 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-mystic-muted">{T.mc[l]}</p>
            <p className="text-sm text-mystic-text">{formatPosition(cusps[9], l)}</p>
          </div>
        </div>
      )}

      <ul className="w-full mt-3 divide-y divide-mystic-accent/10">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 py-2">
            <span className="w-6 text-center text-lg leading-none text-[#e9c97a]" aria-hidden>
              {r.glyph}
            </span>
            <span className="flex-1 text-sm text-mystic-text">{r.name[l]}</span>
            <span className="text-sm text-mystic-muted tabular-nums">{r.position}</span>
            <span className="w-12 text-right text-[11px] text-mystic-muted/70 tabular-nums">
              {r.house} {T.house[l]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
