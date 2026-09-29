'use client';

/**
 * Realistic moon: a photo texture with the exact phase shadow.
 * The dark side keeps a faint bluish earthshine, the terminator is softly
 * blurred, the limb is slightly darkened, and a warm halo breathes around it.
 */

import { useId } from 'react';

interface Props {
  /** 0 = new, 90 = first quarter, 180 = full, 270 = last quarter */
  phaseAngle: number;
  size: number;
  /** Outer glow strength 0..1 */
  glow?: number;
  className?: string;
}

/** SVG path of the lit part of a disk of radius r centred at (c, c) */
export function litPath(phaseAngle: number, c: number, r: number): string {
  const a = ((phaseAngle % 360) + 360) % 360;
  const waxing = a < 180;
  const k = Math.cos((a * Math.PI) / 180); // 1 new … -1 full
  const rx = Math.max(0.001, Math.abs(k) * r);
  const gibbous = k < 0; // more than half lit
  const top = `${c} ${c - r}`;
  const bottom = `${c} ${c + r}`;
  if (waxing) {
    // right limb top → bottom, then the terminator back to the top
    return `M ${top} A ${r} ${r} 0 0 1 ${bottom} A ${rx} ${r} 0 0 ${gibbous ? 1 : 0} ${top} Z`;
  }
  // waning: left limb
  return `M ${top} A ${r} ${r} 0 0 0 ${bottom} A ${rx} ${r} 0 0 ${gibbous ? 0 : 1} ${top} Z`;
}

export default function MoonDisc({ phaseAngle, size, glow = 1, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const V = 200; // viewBox units
  const c = V / 2;
  const r = V * 0.34;
  const imgR = r;
  const lit = litPath(phaseAngle, c, r);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${V} ${V}`}
      className={className}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="34%" stopColor="rgba(255,236,200,0.55)" />
          <stop offset="48%" stopColor="rgba(250,220,170,0.18)" />
          <stop offset="70%" stopColor="rgba(190,160,255,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id={`limb-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(10,8,30,0.55)" />
        </radialGradient>
        <radialGradient id={`sheen-${id}`} cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="rgba(255,248,230,0.22)" />
          <stop offset="100%" stopColor="rgba(255,248,230,0)" />
        </radialGradient>
        <filter id={`soft-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={r * 0.045} />
        </filter>
        {/* sRGB interpolation: in the default linearRGB 10% would look like 35% */}
        <filter id={`earth-${id}`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.13 0 0 0 0.01  0 0.14 0 0 0.012  0 0 0.2 0 0.03  0 0 0 1 0"
          />
        </filter>
        <clipPath id={`disk-${id}`}>
          <circle cx={c} cy={c} r={r} />
        </clipPath>
        <mask id={`lit-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={V} height={V}>
          <rect width={V} height={V} fill="black" />
          <path d={lit} fill="white" filter={`url(#soft-${id})`} />
        </mask>
      </defs>

      {/* breathing halo */}
      <circle
        cx={c}
        cy={c}
        r={V * 0.5}
        fill={`url(#halo-${id})`}
        opacity={0.35 + 0.65 * glow}
        className="moon-halo"
      />

      <g clipPath={`url(#disk-${id})`}>
        {/* dark side with earthshine */}
        <image
          href="/ui/moon.webp"
          x={c - imgR}
          y={c - imgR}
          width={imgR * 2}
          height={imgR * 2}
          filter={`url(#earth-${id})`}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* lit side */}
        <image
          href="/ui/moon.webp"
          x={c - imgR}
          y={c - imgR}
          width={imgR * 2}
          height={imgR * 2}
          mask={`url(#lit-${id})`}
          preserveAspectRatio="xMidYMid slice"
        />
        <circle cx={c} cy={c} r={r} fill={`url(#sheen-${id})`} mask={`url(#lit-${id})`} />
        <circle cx={c} cy={c} r={r} fill={`url(#limb-${id})`} />
      </g>
      {/* hairline rim */}
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,240,210,0.18)" strokeWidth="0.6" />
    </svg>
  );
}
