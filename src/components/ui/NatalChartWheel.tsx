'use client';

import { useEffect, useRef } from 'react';

interface NatalChartWheelProps {
  planets: Record<string, number[]>;
  cusps: number[];
  width?: number;
}

/**
 * Renders a real SVG natal chart wheel using @astrodraw/astrochart.
 * All data is pre-calculated server-side; this just visualizes it.
 */
export default function NatalChartWheel({ planets, cusps, width = 380 }: NatalChartWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import to avoid SSR issues (library needs DOM)
    import('@astrodraw/astrochart').then(({ default: Chart }) => {
      const el = containerRef.current;
      if (!el) return;

      // Clear previous render
      el.innerHTML = '';

      // Create unique ID
      const chartId = `natal-chart-${Date.now()}`;
      const wrapper = document.createElement('div');
      wrapper.id = chartId;
      el.appendChild(wrapper);

      const chart = new Chart(chartId, width, width, {
        COLORS_SIGNS: [
          '#FF4136', '#8B572A', '#FFDC00', '#0074D9',
          '#FF851B', '#3D9970', '#B10DC9', '#85144b',
          '#FF6347', '#2ECC40', '#39CCCC', '#7FDBFF',
        ],
        COLOR_ARIES: '#FF4136',
        COLOR_TAURUS: '#8B572A',
        COLOR_GEMINI: '#FFDC00',
        COLOR_CANCER: '#0074D9',
        COLOR_LEO: '#FF851B',
        COLOR_VIRGO: '#3D9970',
        COLOR_LIBRA: '#B10DC9',
        COLOR_SCORPIO: '#85144b',
        COLOR_SAGITTARIUS: '#FF6347',
        COLOR_CAPRICORN: '#2ECC40',
        COLOR_AQUARIUS: '#39CCCC',
        COLOR_PISCES: '#7FDBFF',
        MARGIN: 40,
        SYMBOL_SCALE: 0.8,
        PADDING: 20,
        COLOR_BACKGROUND: 'transparent',
        POINTS_COLOR: '#D4AF37',
        CUSPS_FONT_COLOR: '#D4AF3780',
        LINE_COLOR: '#D4AF3730',
        CIRCLE_COLOR: '#D4AF3740',
      });

      const radix = chart.radix({ planets, cusps });
      radix.aspects();

      // Style the SVG to fit container
      const svg = el.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxWidth = `${width}px`;
      }
    });
  }, [planets, cusps, width]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="w-full flex justify-center"
        style={{ maxWidth: width }}
      />
      <p className="text-center text-[11px] text-mystic-muted/60 mt-2 tracking-wider uppercase">
        ✦ Натальная карта ✦
      </p>
    </div>
  );
}
