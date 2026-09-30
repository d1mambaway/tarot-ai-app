'use client';

import StarSky from './StarSky';
import { useAppStore } from '@/store/app-store';

/**
 * Animated starry night sky over a painted nebula in the deck's jewel tones
 * (crimson, emerald, midnight blue, gold). The nebula is static CSS
 * gradients, so it costs nothing per frame; the stars, milky way, shooting
 * stars and constellations are drawn by StarSky.
 */

// Soft jewel-tone clouds: [color, x%, y%, size px]
const NEBULA: [string, number, number, number][] = [
  ['163,18,58', 18, 16, 460],   // crimson
  ['90,26,122', 62, 8, 420],    // violet
  ['15,122,85', 86, 42, 440],   // emerald
  ['27,47,138', 26, 70, 520],   // midnight blue
  ['184,134,43', 74, 92, 460],  // warm gold
];

export default function StarField() {
  const locale = useAppStore((st) => st.locale);

  return (
    <>
      <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {NEBULA.map(([rgb, x, y, size]) => (
          <div
            key={rgb}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              background: `radial-gradient(circle, rgba(${rgb},0.30) 0%, rgba(${rgb},0.13) 38%, rgba(${rgb},0) 70%)`,
            }}
          />
        ))}
      </div>
      <StarSky locale={(locale || 'ru') as 'ru' | 'uk' | 'en'} />
    </>
  );
}
