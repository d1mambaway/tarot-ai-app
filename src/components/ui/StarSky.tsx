'use client';

/**
 * Night sky canvas: three depth layers of stars drifting at different speeds,
 * spectral colours, soft glow and short tapered glints on the bright ones,
 * rare flares, a milky way band, shooting stars, and the zodiac
 * constellations appearing one after another.
 *
 * Cheap on phones: ~25 fps, glows are pre-rendered sprites, the milky way is
 * drawn once on its own canvas, nothing runs while the app is hidden, and
 * reduced motion gets a single still frame.
 */

import { useEffect, useRef } from 'react';
import { ZODIAC_CONSTELLATIONS } from '@/data/zodiac-constellations';

type L = 'ru' | 'uk' | 'en';

export interface StarSkyProps {
  locale?: L;
  milkyWay?: boolean;
  shooting?: boolean;
  constellations?: boolean;
  /** Show rare events more often (for recording previews) */
  demo?: boolean;
}

// Spectral palette, weighted: [rgb, weight]
const SPECTRUM: [string, number][] = [
  ['255,255,255', 30],
  ['214,228,255', 16], // blue-white
  ['176,200,255', 7],  // blue
  ['255,246,222', 16], // pale yellow
  ['255,226,160', 10], // yellow / gold
  ['255,196,140', 5],  // orange
  ['255,164,140', 2],  // red giant
];
const SPECTRUM_TOTAL = SPECTRUM.reduce((a, [, w]) => a + w, 0);
function pickColor(): string {
  let r = Math.random() * SPECTRUM_TOTAL;
  for (const [c, w] of SPECTRUM) if ((r -= w) <= 0) return c;
  return SPECTRUM[0][0];
}

// Stars per 100k px², size range, alpha range, drift px/s
const LAYERS = [
  { density: 110, size: [0.25, 0.7], alpha: [0.15, 0.55], drift: 0.8 },
  { density: 40, size: [0.6, 1.25], alpha: [0.3, 0.8], drift: 1.8 },
  { density: 9, size: [1.2, 2.2], alpha: [0.5, 1], drift: 3.2 },
] as const;

const FRAME_MS = 40; // ~25 fps: the sky moves slowly, it looks the same as 60

interface Star { x: number; y: number; r: number; a: number; target: number; speed: number; next: number; color: string; layer: number; flare: number }
interface Meteor { x: number; y: number; vx: number; vy: number; life: number; max: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A soft round glow in one colour, drawn once and reused as a sprite */
function glowSprite(color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${color},0.55)`);
  grad.addColorStop(0.25, `rgba(${color},0.18)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export default function StarSky({ locale = 'ru', milkyWay = true, shooting = true, constellations = true, demo = false }: StarSkyProps) {
  const wayRef = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sky = skyRef.current;
    const ctx = sky?.getContext('2d');
    if (!sky || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const sprites = new Map(SPECTRUM.map(([c]) => [c, glowSprite(c)]));

    let W = 0, H = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nextMeteor = demo ? 1500 : rand(15000, 30000);
    // Constellations take turns; start from a random one
    let zIndex = Math.floor(Math.random() * ZODIAC_CONSTELLATIONS.length);
    const CONST_CYCLE = demo ? 9000 : 45000;
    let constT = demo ? -1200 : -rand(6000, 12000);

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      for (const c of [sky!, wayRef.current]) {
        if (!c) continue;
        c.width = W * dpr; c.height = H * dpr;
        c.style.width = `${W}px`; c.style.height = `${H}px`;
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      LAYERS.forEach((L, layer) => {
        const n = Math.round((W * H) / 100000 * L.density);
        for (let i = 0; i < n; i++) {
          const a = rand(L.alpha[0], L.alpha[1]);
          stars.push({ x: Math.random() * W, y: Math.random() * H, r: rand(L.size[0], L.size[1]), a, target: a, speed: rand(0.2, 0.9), next: rand(0, 6000), color: pickColor(), layer, flare: 0 });
        }
      });
      drawMilkyWay();
    }

    // Milky way: a diagonal band of dust and soft light with a darker lane, drawn once
    function drawMilkyWay() {
      const c = wayRef.current;
      const w = c?.getContext('2d');
      if (!c || !w) return;
      w.setTransform(dpr, 0, 0, dpr, 0, 0);
      w.clearRect(0, 0, W, H);
      if (!milkyWay) return;
      const x0 = -0.1 * W, y0 = 0.95 * H, x1 = 1.1 * W, y1 = 0.05 * H;
      const len = Math.hypot(x1 - x0, y1 - y0);
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      const nx = -uy, ny = ux;
      const width = Math.min(W, H) * 0.22;
      const at = (t: number, off: number) => [x0 + ux * len * t + nx * off, y0 + uy * len * t + ny * off];
      for (let i = 0; i < 26; i++) {
        const [cx, cy] = at(Math.random(), (Math.random() - 0.5) * width * 0.6);
        const rad = width * rand(0.5, 1.1);
        const g = w.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const tone = Math.random() < 0.5 ? '200,190,255' : '255,232,200';
        g.addColorStop(0, `rgba(${tone},0.05)`);
        g.addColorStop(1, `rgba(${tone},0)`);
        w.fillStyle = g;
        w.beginPath(); w.arc(cx, cy, rad, 0, Math.PI * 2); w.fill();
      }
      const n = Math.round(len * 3.2);
      for (let i = 0; i < n; i++) {
        const gauss = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const [x, y] = at(Math.random(), gauss * width * 0.55);
        w.fillStyle = `rgba(${Math.random() < 0.7 ? '255,255,255' : '255,236,200'},${rand(0.08, 0.45).toFixed(2)})`;
        w.fillRect(x, y, rand(0.4, 1.1), rand(0.4, 1.1));
      }
      w.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 14; i++) {
        const [cx, cy] = at(rand(0.1, 0.9), (Math.random() - 0.5) * width * 0.15);
        const rad = width * rand(0.12, 0.25);
        const g = w.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        w.fillStyle = g; w.beginPath(); w.arc(cx, cy, rad, 0, Math.PI * 2); w.fill();
      }
      w.globalCompositeOperation = 'source-over';
    }

    /** Short tapered glint: thin at the tip, fading out, like a lens sparkle */
    function glint(x: number, y: number, len: number, width: number, color: string, alpha: number, angle: number) {
      for (const dir of [0, Math.PI / 2]) {
        const a = angle + dir;
        const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
        const px = -Math.sin(a) * width, py = Math.cos(a) * width;
        const g = ctx!.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
        g.addColorStop(0, `rgba(${color},0)`);
        g.addColorStop(0.5, `rgba(${color},${alpha.toFixed(3)})`);
        g.addColorStop(1, `rgba(${color},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(x - dx, y - dy);
        ctx!.lineTo(x + px, y + py);
        ctx!.lineTo(x + dx, y + dy);
        ctx!.lineTo(x - px, y - py);
        ctx!.closePath();
        ctx!.fill();
      }
    }

    function drawStar(s: Star) {
      const alpha = Math.min(1, s.a + s.flare);
      const r = s.r * (1 + s.flare * 0.6);
      if (s.layer > 0 && alpha > 0.3) {
        const gr = r * (s.layer === 2 ? 7 : 5) * (1 + s.flare);
        ctx!.globalAlpha = alpha * (s.layer === 2 ? 0.9 : 0.6);
        ctx!.drawImage(sprites.get(s.color)!, s.x - gr, s.y - gr, gr * 2, gr * 2);
        ctx!.globalAlpha = 1;
      }
      ctx!.fillStyle = `rgba(${s.color},${alpha.toFixed(3)})`;
      ctx!.beginPath(); ctx!.arc(s.x, s.y, r, 0, Math.PI * 2); ctx!.fill();
      // Only the brightest near stars glint, softly
      if (s.layer === 2 && alpha > 0.7) {
        const k = (alpha - 0.7) / 0.3;
        glint(s.x, s.y, r * (3.2 + s.flare * 5), r * 0.35, s.color, 0.35 * k + 0.3 * s.flare, 0);
      }
    }

    function drawConstellation(t: number) {
      const hold = demo ? 3500 : 6000;
      const total = 2000 + hold + 2000;
      if (t < 0 || t > total) return;
      const z = ZODIAC_CONSTELLATIONS[zIndex];
      const k = t < 2000 ? t / 2000 : t < 2000 + hold ? 1 : 1 - (t - 2000 - hold) / 2000;
      const bw = Math.min(W * 0.72, 320), bh = bw * 0.8;
      const bx = (W - bw) / 2, by = H * 0.14;
      const P = (x: number, y: number) => [bx + x * bw, by + y * bh] as const;
      const draw = Math.min(1, (t / 2000) * 1.2); // lines draw on during fade-in
      ctx!.strokeStyle = `rgba(233,201,122,${(0.4 * k).toFixed(3)})`;
      ctx!.lineWidth = 0.8;
      for (const [a, b] of z.lines) {
        const [ax, ay] = P(z.stars[a][0], z.stars[a][1]);
        const [cx, cy] = P(z.stars[b][0], z.stars[b][1]);
        ctx!.beginPath(); ctx!.moveTo(ax, ay); ctx!.lineTo(ax + (cx - ax) * draw, ay + (cy - ay) * draw); ctx!.stroke();
      }
      const glow = sprites.get('255,246,222')!;
      for (const [x, y, s] of z.stars) {
        const [px, py] = P(x, y);
        const gr = s * 7;
        ctx!.globalAlpha = k;
        ctx!.drawImage(glow, px - gr, py - gr, gr * 2, gr * 2);
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = `rgba(255,246,222,${k.toFixed(3)})`;
        ctx!.beginPath(); ctx!.arc(px, py, Math.max(0.7, s * 0.9), 0, Math.PI * 2); ctx!.fill();
      }
      ctx!.font = '600 15px "Cormorant Garamond", Georgia, serif';
      ctx!.textAlign = 'center';
      ctx!.fillStyle = `rgba(233,201,122,${(0.8 * k).toFixed(3)})`;
      ctx!.fillText(`${z.glyph}︎ ${z.name[locale]}`, bx + bw / 2, by + bh + 22);
      ctx!.textAlign = 'start';
    }

    function drawMeteors(dt: number) {
      nextMeteor -= dt;
      if (nextMeteor <= 0) {
        const ang = rand(0.3, 0.6);
        const dir = Math.random() < 0.5 ? 1 : -1;
        const speed = rand(700, 1000);
        meteors.push({ x: dir > 0 ? rand(0, W * 0.6) : rand(W * 0.4, W), y: rand(0, H * 0.35), vx: Math.cos(ang) * speed * dir, vy: Math.sin(ang) * speed, life: 0, max: rand(700, 1000) });
        nextMeteor = demo ? rand(2500, 4000) : rand(15000, 30000);
      }
      meteors = meteors.filter((m) => m.life < m.max);
      for (const m of meteors) {
        m.life += dt; m.x += m.vx * dt / 1000; m.y += m.vy * dt / 1000;
        const k = Math.sin(Math.PI * m.life / m.max);
        const tx = m.x - m.vx * 0.14, ty = m.y - m.vy * 0.14;
        const g = ctx!.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, `rgba(255,246,222,${(0.95 * k).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,246,222,0)');
        ctx!.strokeStyle = g; ctx!.lineWidth = 1.4; ctx!.lineCap = 'round';
        ctx!.beginPath(); ctx!.moveTo(m.x, m.y); ctx!.lineTo(tx, ty); ctx!.stroke();
        ctx!.fillStyle = `rgba(255,255,255,${k.toFixed(3)})`;
        ctx!.beginPath(); ctx!.arc(m.x, m.y, 1.3, 0, Math.PI * 2); ctx!.fill();
      }
    }

    let last = 0, raf = 0;
    function frame(now: number) {
      if (!reduceMotion) raf = requestAnimationFrame(frame);
      if (document.hidden || (last && now - last < FRAME_MS)) return;
      const dt = last ? Math.min(100, now - last) : 16;
      last = now;
      ctx!.clearRect(0, 0, W, H);

      for (const s of stars) {
        if (!reduceMotion) {
          const drift = LAYERS[s.layer].drift * dt / 1000;
          s.x -= drift; s.y -= drift * 0.35;
          if (s.x < -4) s.x += W + 8;
          if (s.y < -4) s.y += H + 8;
          s.next -= dt;
          if (s.next <= 0) {
            const L = LAYERS[s.layer];
            s.target = rand(L.alpha[0] * 0.4, L.alpha[1]);
            s.next = rand(1500, 7000);
            if (s.layer === 2 && Math.random() < 0.12) s.flare = 1; // a rare flare
          }
          s.a += (s.target - s.a) * Math.min(1, s.speed * dt / 1000);
          if (s.flare > 0) s.flare = Math.max(0, s.flare - dt / 1400);
        }
        drawStar(s);
      }

      if (reduceMotion) return;

      if (constellations) {
        constT += dt;
        if (constT > CONST_CYCLE) {
          constT = 0;
          zIndex = (zIndex + 1) % ZODIAC_CONSTELLATIONS.length;
        }
        drawConstellation(constT);
      }
      if (shooting) drawMeteors(dt);
    }

    resize();
    raf = requestAnimationFrame(frame);
    const onResize = () => { resize(); if (reduceMotion) { last = 0; frame(performance.now()); } };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [locale, milkyWay, shooting, constellations, demo]);

  return (
    <>
      <canvas ref={wayRef} className="fixed inset-0 pointer-events-none z-0" />
      <canvas ref={skyRef} className="fixed inset-0 pointer-events-none z-0" />
    </>
  );
}
