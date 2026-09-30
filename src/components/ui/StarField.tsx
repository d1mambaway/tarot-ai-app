'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated starry night sky over a painted nebula in the deck's jewel tones
 * (crimson, emerald, midnight blue, gold). The nebula is static CSS
 * gradients, so it costs nothing per frame; stars twinkle on a canvas and the
 * brightest ones get thin light rays.
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    interface Star {
      x: number;
      y: number;
      baseSize: number;
      alpha: number;
      targetAlpha: number;
      fadeSpeed: number;
      nextChange: number;
      color: string;
    }

    let stars: Star[] = [];
    let W = 0;
    let H = 0;

    // Palette: mostly white, some warm gold, a few cool
    const COLORS = [
      'rgba(255,255,255,',    // pure white
      'rgba(255,255,255,',    // pure white (more common)
      'rgba(244,241,255,',    // soft white
      'rgba(243,217,139,',    // warm gold
      'rgba(255,232,190,',    // champagne
      'rgba(200,215,255,',    // blue-white
    ];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initStars() {
      const count = 200;
      stars = [];
      for (let i = 0; i < count; i++) {
        const alpha = Math.random() * 0.6 + 0.1;
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          baseSize: Math.random() < 0.85
            ? Math.random() * 1.2 + 0.3   // most stars are tiny
            : Math.random() * 2 + 1,       // a few are larger
          alpha,
          targetAlpha: alpha,
          fadeSpeed: Math.random() * 0.01 + 0.003,
          nextChange: Math.random() * 200,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    }

    // Twinkling is slow, so ~25 fps looks the same as 60-120 fps while the
    // full-screen canvas costs a fraction of the battery. `steps` keeps the
    // fade speed identical to the old per-frame animation.
    const FRAME_MS = 40;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let last = 0;

    function draw(now = 0) {
      if (document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }
      if (now - last < FRAME_MS && last !== 0) {
        animId = requestAnimationFrame(draw);
        return;
      }
      const steps = last === 0 ? 1 : Math.min(4, (now - last) / 16.7);
      last = now;
      ctx!.clearRect(0, 0, W, H);

      for (const star of stars) {
        // Randomly pick new target alpha
        star.nextChange -= steps;
        if (star.nextChange <= 0) {
          star.targetAlpha = Math.random() * 0.8 + 0.05;
          star.fadeSpeed = Math.random() * 0.015 + 0.003;
          star.nextChange = Math.random() * 300 + 60; // frames until next change
        }

        // Smoothly fade toward target
        if (star.alpha < star.targetAlpha) {
          star.alpha = Math.min(star.alpha + star.fadeSpeed * steps, star.targetAlpha);
        } else {
          star.alpha = Math.max(star.alpha - star.fadeSpeed * steps, star.targetAlpha);
        }

        // Draw star dot
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.baseSize, 0, Math.PI * 2);
        ctx!.fillStyle = star.color + star.alpha.toFixed(3) + ')';
        ctx!.fill();

        // Soft glow for brighter/larger stars
        if (star.alpha > 0.4 && star.baseSize > 0.8) {
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, star.baseSize * 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = star.color + (star.alpha * 0.12).toFixed(3) + ')';
          ctx!.fill();
        }

        // Thin light rays on the brightest stars
        if (star.baseSize > 1.6 && star.alpha > 0.5) {
          const len = star.baseSize * 6;
          ctx!.strokeStyle = star.color + ((star.alpha - 0.4) * 0.6).toFixed(3) + ')';
          ctx!.lineWidth = 0.5;
          ctx!.beginPath();
          ctx!.moveTo(star.x - len, star.y);
          ctx!.lineTo(star.x + len, star.y);
          ctx!.moveTo(star.x, star.y - len * 0.6);
          ctx!.lineTo(star.x, star.y + len * 0.6);
          ctx!.stroke();
        }
      }

      if (!reduceMotion) animId = requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();

    const onResize = () => { resize(); initStars(); if (reduceMotion) { last = 0; draw(); } };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

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
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
    </>
  );
}
