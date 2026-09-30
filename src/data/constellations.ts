/**
 * Star layouts for the «Путь Шута» collection screen, in a 358×430 box.
 * Points are in card order: the Major Arcana path runs Fool → World; each
 * suit runs Ace → King. Lines join consecutive stars.
 */

export const SKY_W = 358;
export const SKY_H = 430;

export type Point = [number, number];

// The Fool's journey winds up from the bottom-left corner (matches the mockup)
const MAJOR: Point[] = [
  [20, 400], [70, 370], [40, 320], [95, 290], [150, 310], [200, 280], [170, 230], [230, 205],
  [290, 225], [320, 175], [270, 140], [215, 160], [160, 130], [110, 160], [60, 125], [40, 75],
  [95, 50], [150, 70], [205, 40], [260, 60], [305, 30], [330, 90],
];

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// Wands: a staff — a narrow zigzag climbing straight up
const WANDS: Point[] = range(14).map((i) => [179 + (i % 2 === 0 ? -34 : 34) * (1 - i / 20), 400 - i * 28]);

// Cups: a chalice — a deep bowl, rims up
const CUPS: Point[] = range(14).map((i) => {
  const t = Math.PI - (i / 13) * Math.PI;
  return [Math.round(179 + 150 * Math.cos(t)), Math.round(120 + 230 * Math.sin(t))];
});

// Swords: pommel, grip, crossguard, then a long blade on the diagonal
const SWORDS: Point[] = [
  [90, 396], [115, 365], [88, 343], [142, 387],
  ...range(10).map((i): Point => [134 + i * 22, 342 - i * 28]),
];

// Pentacles: a coin — a full ring
const PENTACLES: Point[] = range(14).map((i) => {
  const t = -Math.PI / 2 + (i / 14) * Math.PI * 2;
  return [Math.round(179 + 150 * Math.cos(t)), Math.round(215 + 150 * Math.sin(t))];
});

export type SkyKey = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export const CONSTELLATIONS: Record<SkyKey, { points: Point[]; firstCardId: number }> = {
  major: { points: MAJOR, firstCardId: 0 },
  wands: { points: WANDS, firstCardId: 22 },
  cups: { points: CUPS, firstCardId: 36 },
  swords: { points: SWORDS, firstCardId: 50 },
  pentacles: { points: PENTACLES, firstCardId: 64 },
};

export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
