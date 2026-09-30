'use client';

/**
 * Richer star sky (mockup): depth layers with drift, spectral colours and
 * flares, optional milky way, shooting stars and a fading "constellation of
 * the day". Options let us compare variants side by side.
 */

import { useEffect, useRef } from 'react';

export interface StarSkyOptions {
  milkyWay?: boolean;
  shooting?: boolean;
  constellation?: boolean;
  /** Mockup: show rare events more often so a short video catches them */
  demo?: boolean;
}

// Spectral palette, weighted: [rgb, weight]
const SPECTRUM: [string, number][] = [
  ['255,255,255', 30],
  ['214,228,255', 16],  // blue-white
  ['176,200,255', 7],   // blue
  ['255,246,222', 16],  // pale yellow
  ['255,226,160', 10],  // yellow / gold
  ['255,196,140', 5],   // orange
  ['255,164,140', 2],   // red giant
];
const pickColor = () => {
  const total = SPECTRUM.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [c, w] of SPECTRUM) { if ((r -= w) <= 0) return c; }
  return SPECTRUM[0][0];
};

// [count per 100k px², size range, alpha range, drift px/s]
const LAYERS = [
  { density: 110, size: [0.25, 0.7], alpha: [0.15, 0.55], drift: 0.8 },
  { density: 40, size: [0.6, 1.25], alpha: [0.3, 0.8], drift: 1.8 },
  { density: 9, size: [1.2, 2.2], alpha: [0.5, 1], drift: 3.2 },
] as const;

// Taurus, stylised, in a 0..1 box: [x, y, size]
const TAURUS: [number, number, number][] = [
  [0.18, 0.12, 1.6], // 0 Elnath (tip of horn)
  [0.40, 0.40, 1.1], // 1 epsilon
  [0.45, 0.48, 1.0], // 2 delta
  [0.50, 0.56, 1.1], // 3 gamma (vertex of the V)
  [0.44, 0.58, 1.0], // 4 theta
  [0.36, 0.60, 2.2], // 5 Aldebaran
  [0.10, 0.42, 1.4], // 6 zeta (other horn)
  [0.62, 0.66, 1.0], // 7 lambda
  [0.76, 0.74, 1.0], // 8 xi
];
const TAURUS_LINES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 7], [7, 8]];
const PLEIADES: [number, number][] = [[0.80, 0.28], [0.83, 0.26], [0.85, 0.30], [0.82, 0.31], [0.87, 0.27], [0.79, 0.32]];

interface Star { x: number; y: number; r: number; a: number; target: number; speed: number; next: number; color: string; layer: number; flare: number }
interface Meteor { x: number; y: number; vx: number; vy: number; life: number; max: number }

export default function StarSky({ milkyWay, shooting, constellation, demo }: StarSkyOptions) {
  const wayRef = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sky = skyRef.current;
    const ctx = sky?.getContext('2d');
    if (!sky || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nextMeteor = demo ? 1500 : 15000 + Math.random() * 15000;
    let constT = demo ? -1200 : -8000; // ms; <0 = waiting
    const CONST_CYCLE = demo ? 9000 : 45000;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

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

    // Static milky way: a diagonal band of dust and soft glow, drawn once
    function drawMilkyWay() {
      const c = wayRef.current;
      const w = c?.getContext('2d');
      if (!c || !w) return;
      w.setTransform(dpr, 0, 0, dpr, 0, 0);
      w.clearRect(0, 0, W, H);
      if (!milkyWay) return;
      // band from bottom-left to top-right
      const x0 = -0.1 * W, y0 = 0.95 * H, x1 = 1.1 * W, y1 = 0.05 * H;
      const len = Math.hypot(x1 - x0, y1 - y0);
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      const nx = -uy, ny = ux;
      const width = Math.min(W, H) * 0.22;
      for (let i = 0; i < 26; i++) {
        const t = Math.random();
        const off = (Math.random() - 0.5) * width * 0.6;
        const cx = x0 + ux * len * t + nx * off, cy = y0 + uy * len * t + ny * off;
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
        const t = Math.random();
        const gauss = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const off = gauss * width * 0.55;
        const x = x0 + ux * len * t + nx * off, y = y0 + uy * len * t + ny * off;
        w.fillStyle = `rgba(${Math.random() < 0.7 ? '255,255,255' : '255,236,200'},${rand(0.08, 0.45).toFixed(2)})`;
        w.fillRect(x, y, rand(0.4, 1.1), rand(0.4, 1.1));
      }
      // dark dust lane through the middle
      w.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 14; i++) {
        const t = rand(0.1, 0.9);
        const off = (Math.random() - 0.5) * width * 0.15;
        const cx = x0 + ux * len * t + nx * off, cy = y0 + uy * len * t + ny * off;
        const rad = width * rand(0.12, 0.25);
        const g = w.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        w.fillStyle = g; w.beginPath(); w.arc(cx, cy, rad, 0, Math.PI * 2); w.fill();
      }
      w.globalCompositeOperation = 'source-over';
    }

    function drawStar(s: Star) {
      const alpha = Math.min(1, s.a + s.flare);
      const r = s.r * (1 + s.flare * 0.8);
      ctx!.fillStyle = `rgba(${s.color},${alpha.toFixed(3)})`;
      ctx!.beginPath(); ctx!.arc(s.x, s.y, r, 0, Math.PI * 2); ctx!.fill();
      if (s.layer > 0 && alpha > 0.35) {
        const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4);
        g.addColorStop(0, `rgba(${s.color},${(alpha * 0.22).toFixed(3)})`);
        g.addColorStop(1, `rgba(${s.color},0)`);
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(s.x, s.y, r * 4, 0, Math.PI * 2); ctx!.fill();
      }
      if (s.layer === 2 && alpha > 0.6) {
        const len = r * (5 + s.flare * 10);
        ctx!.strokeStyle = `rgba(${s.color},${((alpha - 0.5) * 0.7).toFixed(3)})`;
        ctx!.lineWidth = 0.5;
        ctx!.beginPath();
        ctx!.moveTo(s.x - len, s.y); ctx!.lineTo(s.x + len, s.y);
        ctx!.moveTo(s.x, s.y - len); ctx!.lineTo(s.x, s.y + len);
        ctx!.stroke();
      }
    }

    function drawConstellation(t: number) {
      // fade in 2 s, hold, fade out 2 s
      const hold = demo ? 3500 : 6000;
      const total = 2000 + hold + 2000;
      if (t < 0 || t > total) return;
      const k = t < 2000 ? t / 2000 : t < 2000 + hold ? 1 : 1 - (t - 2000 - hold) / 2000;
      const bw = Math.min(W * 0.78, 340), bh = bw * 0.75;
      const bx = (W - bw) / 2, by = H * 0.16;
      const P = (x: number, y: number) => [bx + x * bw, by + y * bh] as const;
      ctx!.strokeStyle = `rgba(233,201,122,${(0.45 * k).toFixed(3)})`;
      ctx!.lineWidth = 0.8;
      ctx!.setLineDash([]);
      for (const [a, b] of TAURUS_LINES) {
        // lines draw on progressively during the fade-in
        const [ax, ay] = P(TAURUS[a][0], TAURUS[a][1]);
        const [bx2, by2] = P(TAURUS[b][0], TAURUS[b][1]);
        const p = Math.min(1, t / 2000 * 1.2);
        ctx!.beginPath(); ctx!.moveTo(ax, ay); ctx!.lineTo(ax + (bx2 - ax) * p, ay + (by2 - ay) * p); ctx!.stroke();
      }
      for (const [x, y, s] of TAURUS) {
        const [px, py] = P(x, y);
        const g = ctx!.createRadialGradient(px, py, 0, px, py, s * 6);
        g.addColorStop(0, `rgba(255,236,190,${(0.55 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,236,190,0)');
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(px, py, s * 6, 0, Math.PI * 2); ctx!.fill();
        ctx!.fillStyle = `rgba(255,246,222,${k.toFixed(3)})`; ctx!.beginPath(); ctx!.arc(px, py, s, 0, Math.PI * 2); ctx!.fill();
      }
      for (const [x, y] of PLEIADES) {
        const [px, py] = P(x, y);
        ctx!.fillStyle = `rgba(214,228,255,${(0.9 * k).toFixed(3)})`; ctx!.beginPath(); ctx!.arc(px, py, 0.9, 0, Math.PI * 2); ctx!.fill();
      }
      const [lx, ly] = P(0.62, 0.9);
      ctx!.font = '600 15px "Cormorant Garamond", Georgia, serif';
      ctx!.fillStyle = `rgba(233,201,122,${(0.8 * k).toFixed(3)})`;
      ctx!.fillText('♉︎ Телец', lx, ly);
    }

    const FRAME_MS = 33;
    let last = 0, raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || (last && now - last < FRAME_MS)) return;
      const dt = last ? Math.min(100, now - last) : 16;
      last = now;
      ctx!.clearRect(0, 0, W, H);

      for (const s of stars) {
        const drift = LAYERS[s.layer].drift * dt / 1000;
        s.x -= drift; s.y -= drift * 0.35;
        if (s.x < -4) s.x += W + 8;
        if (s.y < -4) s.y += H + 8;
        s.next -= dt;
        if (s.next <= 0) {
          const L = LAYERS[s.layer];
          s.target = rand(L.alpha[0] * 0.4, L.alpha[1]);
          s.next = rand(1500, 7000);
          if (s.layer === 2 && Math.random() < 0.12) s.flare = 1; // rare flare
        }
        s.a += (s.target - s.a) * Math.min(1, s.speed * dt / 1000);
        if (s.flare > 0) s.flare = Math.max(0, s.flare - dt / 1400);
        drawStar(s);
      }

      if (constellation) {
        constT += dt;
        if (constT > CONST_CYCLE) constT = 0;
        drawConstellation(constT);
      }

      if (shooting) {
        nextMeteor -= dt;
        if (nextMeteor <= 0) {
          const ang = rand(0.3, 0.6) * (Math.random() < 0.5 ? 1 : -1);
          const speed = rand(700, 1000);
          const dir = ang > 0 ? 1 : -1;
          meteors.push({ x: dir > 0 ? rand(0, W * 0.6) : rand(W * 0.4, W), y: rand(0, H * 0.35), vx: Math.cos(Math.abs(ang)) * speed * dir, vy: Math.sin(Math.abs(ang)) * speed, life: 0, max: rand(700, 1000) });
          nextMeteor = demo ? rand(2500, 4000) : rand(15000, 30000);
        }
        meteors = meteors.filter((m) => m.life < m.max);
        for (const m of meteors) {
          m.life += dt; m.x += m.vx * dt / 1000; m.y += m.vy * dt / 1000;
          const k = Math.sin(Math.PI * m.life / m.max);
          const tail = 0.14;
          const g = ctx!.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
          g.addColorStop(0, `rgba(255,246,222,${(0.95 * k).toFixed(3)})`);
          g.addColorStop(1, 'rgba(255,246,222,0)');
          ctx!.strokeStyle = g; ctx!.lineWidth = 1.4; ctx!.lineCap = 'round';
          ctx!.beginPath(); ctx!.moveTo(m.x, m.y); ctx!.lineTo(m.x - m.vx * tail, m.y - m.vy * tail); ctx!.stroke();
          ctx!.fillStyle = `rgba(255,255,255,${k.toFixed(3)})`; ctx!.beginPath(); ctx!.arc(m.x, m.y, 1.3, 0, Math.PI * 2); ctx!.fill();
        }
      }
    }

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [milkyWay, shooting, constellation, demo]);

  return (
    <>
      <canvas ref={wayRef} className="fixed inset-0 pointer-events-none z-0" />
      <canvas ref={skyRef} className="fixed inset-0 pointer-events-none z-0" />
    </>
  );
}
