/**
 * Renders the Destiny Matrix octagram as a plain SVG string.
 *
 * Deliberately NOT an AI-generated image: the chart carries 22 exact numbers in
 * exact geometric positions, and a diffusion model would bend both. Vector
 * output is a few kilobytes, sharp on any screen and always arithmetically
 * correct.
 *
 * Kept framework-free so the same function can render inside React, inside a
 * share image, or in a script.
 */

import { DestinyMatrix, arcanaImage } from './matrix';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212,175,55,0.35)';
const PURPLE = '#8B5CF6';

interface Node {
  key: keyof DestinyMatrix | string;
  x: number;
  y: number;
  r: number;
  value: number;
  caption?: string;
  /** Where the caption sits relative to the node — default below the badge */
  captionPos?: 'above' | 'below';
}

/** Escape text going into SVG markup. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nodeMarkup(n: Node, idPrefix: string): string {
  const clipId = `${idPrefix}-clip-${n.key}`;
  const img = arcanaImage(n.value);
  const badgeY = n.y + n.r + 13;
  const fontSize = n.r > 40 ? 17 : 13;

  return `
    <g class="matrix-node">
      <defs><clipPath id="${clipId}"><circle cx="${n.x}" cy="${n.y}" r="${n.r - 3}" /></clipPath></defs>
      <circle cx="${n.x}" cy="${n.y}" r="${n.r + 4}" fill="rgba(212,175,55,0.10)" />
      <image href="${img}" x="${n.x - n.r}" y="${n.y - n.r * 1.35}"
             width="${n.r * 2}" height="${n.r * 2.7}"
             preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" opacity="0.85" />
      <circle cx="${n.x}" cy="${n.y}" r="${n.r - 3}" fill="none" stroke="${GOLD}" stroke-width="1.6" />
      <circle cx="${n.x}" cy="${n.y}" r="${n.r + 4}" fill="none" stroke="${GOLD_DIM}" stroke-width="1" />
      <g>
        <rect x="${n.x - 15}" y="${badgeY - 12}" width="30" height="21" rx="10"
              fill="#140F22" stroke="${GOLD}" stroke-width="1.2" />
        <text x="${n.x}" y="${badgeY + 3}" text-anchor="middle"
              font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}"
              font-weight="bold" fill="${GOLD}">${n.value}</text>
      </g>
      ${
        n.caption
          ? `<text x="${n.x}" y="${n.captionPos === 'above' ? n.y - n.r - 16 : badgeY + 25}" text-anchor="middle"
                   font-family="system-ui, sans-serif" font-size="11" fill="rgba(255,255,255,0.55)"
                   letter-spacing="0.5">${esc(n.caption)}</text>`
          : ''
      }
    </g>`;
}

export interface MatrixSVGOptions {
  /** Unique prefix so several charts on one page keep separate clip paths */
  idPrefix?: string;
  locale?: 'ru' | 'uk' | 'en';
}

const CAPTIONS = {
  ru: { day: 'ДЕНЬ', month: 'МЕСЯЦ', year: 'ГОД', purpose: 'ПРЕДНАЗНАЧЕНИЕ', money: 'ДЕНЬГИ', love: 'ЛЮБОВЬ' },
  uk: { day: 'ДЕНЬ', month: 'МІСЯЦЬ', year: 'РІК', purpose: 'ПРИЗНАЧЕННЯ', money: 'ГРОШІ', love: 'ЛЮБОВ' },
  en: { day: 'DAY', month: 'MONTH', year: 'YEAR', purpose: 'PURPOSE', money: 'MONEY', love: 'LOVE' },
} as const;

/** Build the chart as a standalone SVG string. */
export function renderMatrixSVG(m: DestinyMatrix, opts: MatrixSVGOptions = {}): string {
  const p = opts.idPrefix || 'dm';
  const t = CAPTIONS[opts.locale || 'ru'];

  const cx = 300;
  const cy = 300;
  const R = 205; // outer diamond radius
  const d = R * 0.707; // diagonal square offset

  // Outer diamond
  const A = { x: cx - R, y: cy };
  const B = { x: cx, y: cy - R };
  const C = { x: cx + R, y: cy };
  const D = { x: cx, y: cy + R };
  // Inner diagonal square
  const F = { x: cx - d, y: cy - d };
  const G = { x: cx + d, y: cy - d };
  const H = { x: cx + d, y: cy + d };
  const I = { x: cx - d, y: cy + d };

  const nodes: Node[] = [
    { key: 'A', ...A, r: 32, value: m.A, caption: t.day },
    { key: 'B', ...B, r: 32, value: m.B, caption: t.month, captionPos: 'above' },
    { key: 'C', ...C, r: 32, value: m.C, caption: t.year },
    { key: 'D', ...D, r: 32, value: m.D, caption: t.purpose },
    { key: 'F', ...F, r: 26, value: m.F },
    { key: 'G', ...G, r: 26, value: m.G },
    { key: 'H', ...H, r: 26, value: m.H },
    { key: 'I', ...I, r: 26, value: m.I },
    { key: 'E', x: cx, y: cy, r: 46, value: m.E },
  ];

  const poly = (pts: { x: number; y: number }[], stroke: string, w: number) =>
    `<polygon points="${pts.map((q) => `${q.x},${q.y}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}" />`;

  // Purpose row under the chart
  const purposeY = 650;
  const purpose = [
    { x: 150, v: m.personalPurpose, label: opts.locale === 'en' ? 'Personal' : 'Личностное' },
    { x: 300, v: m.spiritualPurpose, label: opts.locale === 'en' ? 'Spiritual' : 'Духовное' },
    { x: 450, v: m.socialPurpose, label: opts.locale === 'en' ? 'Social' : 'Социальное' },
  ];

  return `
<svg viewBox="0 0 600 720" xmlns="http://www.w3.org/2000/svg" width="100%" role="img" aria-label="Destiny Matrix">
  <defs>
    <radialGradient id="${p}-glow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${PURPLE}" stop-opacity="0.28" />
      <stop offset="100%" stop-color="${PURPLE}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <circle cx="${cx}" cy="${cy}" r="260" fill="url(#${p}-glow)" />
  <circle cx="${cx}" cy="${cy}" r="${R + 30}" fill="none" stroke="${GOLD_DIM}" stroke-width="1" stroke-dasharray="3 7" />

  <!-- octagram: diamond + diagonal square -->
  ${poly([A, B, C, D], GOLD, 1.6)}
  ${poly([F, G, H, I], GOLD, 1.6)}

  <!-- axes through the centre -->
  <line x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke="${GOLD_DIM}" stroke-width="1" />
  <line x1="${B.x}" y1="${B.y}" x2="${D.x}" y2="${D.y}" stroke="${GOLD_DIM}" stroke-width="1" />
  <!-- money channel (F–E–H) and love channel (G–E–I) -->
  <line x1="${F.x}" y1="${F.y}" x2="${H.x}" y2="${H.y}" stroke="${GOLD}" stroke-width="1" stroke-dasharray="5 5" opacity="0.6" />
  <line x1="${G.x}" y1="${G.y}" x2="${I.x}" y2="${I.y}" stroke="${PURPLE}" stroke-width="1" stroke-dasharray="5 5" opacity="0.7" />

  ${nodes.map((n) => nodeMarkup(n, p)).join('')}

  <!-- channel points -->
  <g font-family="system-ui, sans-serif" font-size="11" fill="rgba(255,255,255,0.6)">
    <text x="${H.x + 62}" y="${H.y - 34}" text-anchor="middle">${t.money}: ${m.moneyPoint}</text>
    <text x="${I.x - 58}" y="${I.y - 34}" text-anchor="middle">${t.love}: ${m.lovePoint}</text>
  </g>

  <!-- purpose line -->
  <line x1="110" y1="${purposeY - 52}" x2="490" y2="${purposeY - 60}" stroke="${GOLD_DIM}" stroke-width="1" />
  ${purpose
    .map(
      (q) => `
    <g>
      <circle cx="${q.x}" cy="${purposeY}" r="26" fill="rgba(212,175,55,0.08)" stroke="${GOLD}" stroke-width="1.3" />
      <text x="${q.x}" y="${purposeY + 7}" text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="bold" fill="${GOLD}">${q.v}</text>
      <text x="${q.x}" y="${purposeY + 46}" text-anchor="middle"
            font-family="system-ui, sans-serif" font-size="11" fill="rgba(255,255,255,0.55)">${esc(q.label)}</text>
    </g>`
    )
    .join('')}
</svg>`.trim();
}
