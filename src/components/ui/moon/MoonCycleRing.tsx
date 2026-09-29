'use client';

/**
 * Thin golden ring with the 8 phases of the lunar cycle and a glowing
 * marker for today. New moon sits at the top, the cycle runs clockwise.
 */

import { motion } from 'framer-motion';
import { litPath } from './MoonDisc';

interface Props {
  phaseAngle: number;
  size: number;
}

export default function MoonCycleRing({ phaseAngle, size }: Props) {
  const V = 200;
  const c = V / 2;
  const R = 92;
  const phases = Array.from({ length: 8 }, (_, i) => i * 45);
  const pos = (deg: number, rad = R) => {
    const t = ((deg - 90) * Math.PI) / 180;
    return { x: c + Math.cos(t) * rad, y: c + Math.sin(t) * rad };
  };
  const mk = pos(phaseAngle);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${V} ${V}`} className="absolute inset-0" aria-hidden>
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3dca0" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#c4a35a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f3dca0" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="ring-marker" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="45%" stopColor="#f0cf7a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f0cf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={R} fill="none" stroke="url(#ring-gold)" strokeWidth="0.8" />
      <circle cx={c} cy={c} r={R - 5} fill="none" stroke="rgba(196,163,90,0.08)" strokeWidth="0.6" strokeDasharray="1 3" />
      {phases.map((deg) => {
        const p = pos(deg);
        const rr = 4.2;
        return (
          <g key={deg} opacity={0.85}>
            <circle cx={p.x} cy={p.y} r={rr} fill="#15122b" stroke="rgba(243,220,160,0.45)" strokeWidth="0.5" />
            <path
              d={litPath(deg === 0 ? 1 : deg, 0, rr)}
              transform={`translate(${p.x} ${p.y})`}
              fill="rgba(243,220,160,0.85)"
            />
          </g>
        );
      })}
      <motion.g
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        style={{ originX: `${c}px`, originY: `${c}px` }}
      >
        <circle cx={mk.x} cy={mk.y} r={9} fill="url(#ring-marker)" className="moon-marker" />
        <circle cx={mk.x} cy={mk.y} r={2.2} fill="#fffaf0" />
      </motion.g>
    </svg>
  );
}
