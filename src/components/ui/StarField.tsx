'use client';

import { useEffect, useRef } from 'react';

/** Animated starry night sky — dense field with natural twinkling */
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

    // Color palette — slight variations of white/blue/gold
    const COLORS = [
      'rgba(255,255,255,',    // pure white
      'rgba(255,255,255,',    // pure white (more common)
      'rgba(220,220,255,',    // cool white
      'rgba(200,190,255,',    // lavender
      'rgba(255,230,180,',    // warm golden
      'rgba(180,200,255,',    // blue-white
      'rgba(255,200,220,',    // pink-white
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

    let frame = 0;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      frame++;

      for (const star of stars) {
        // Randomly pick new target alpha
        star.nextChange--;
        if (star.nextChange <= 0) {
          star.targetAlpha = Math.random() * 0.8 + 0.05;
          star.fadeSpeed = Math.random() * 0.015 + 0.003;
          star.nextChange = Math.random() * 300 + 60; // frames until next change
        }

        // Smoothly fade toward target
        if (star.alpha < star.targetAlpha) {
          star.alpha = Math.min(star.alpha + star.fadeSpeed, star.targetAlpha);
        } else {
          star.alpha = Math.max(star.alpha - star.fadeSpeed, star.targetAlpha);
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
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    initStars();
    draw();

    const onResize = () => { resize(); initStars(); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
