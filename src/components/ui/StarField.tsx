'use client';

import { useEffect, useRef } from 'react';

/** Animated starry night sky — stars twinkle, appear, and fade randomly */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let stars: Star[] = [];

    interface Star {
      x: number;
      y: number;
      size: number;
      maxAlpha: number;
      alpha: number;
      speed: number; // how fast it fades in/out
      phase: number; // current phase position
      color: [number, number, number];
    }

    const STAR_COUNT = 80;

    const COLORS: [number, number, number][] = [
      [255, 255, 255],   // white
      [200, 180, 255],   // lavender
      [170, 140, 255],   // purple
      [255, 220, 150],   // golden
      [180, 200, 255],   // blue-white
    ];

    function resize() {
      canvas!.width = window.innerWidth * devicePixelRatio;
      canvas!.height = window.innerHeight * devicePixelRatio;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function initStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 2 + 0.5,
          maxAlpha: Math.random() * 0.7 + 0.3,
          alpha: Math.random(),
          speed: Math.random() * 0.008 + 0.003,
          phase: Math.random() * Math.PI * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const star of stars) {
        // Update phase
        star.phase += star.speed;

        // Sine-based twinkle with randomized pauses
        const wave = Math.sin(star.phase);
        // Make some stars spend more time dark (asymmetric twinkle)
        star.alpha = star.maxAlpha * Math.max(0, wave);

        if (star.alpha < 0.02) continue; // skip invisible stars

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        const [r, g, b] = star.color;
        ctx!.fillStyle = `rgba(${r},${g},${b},${star.alpha})`;
        ctx!.fill();

        // Add glow for brighter stars
        if (star.alpha > 0.5 && star.size > 1) {
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${r},${g},${b},${star.alpha * 0.15})`;
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();

    window.addEventListener('resize', () => { resize(); initStars(); });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
