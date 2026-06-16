'use client';

import { useEffect, useState } from 'react';

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 3,
}));

const MESSAGES_RU = [
  'Карты перемешиваются...',
  'Связь с потусторонним...',
  'Звёзды выстраиваются...',
  'Энергия концентрируется...',
];

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES_RU.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-mystic-bg overflow-hidden z-[100]">
      {/* Stars */}
      {STARS.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-mystic-accent star-particle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-mystic-purple/20 animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-mystic-blue/20 animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Moon */}
      <div className="absolute top-12 right-8 text-5xl animate-float-slow opacity-60">🌙</div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Crystal ball / card animation */}
        <div className="relative mb-6">
          <div className="text-7xl animate-float">🔮</div>
          <div className="absolute -inset-4 rounded-full bg-mystic-accent/10 animate-pulse-glow" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold font-mystic text-gradient-gold mb-2">
          Магия Карт
        </h1>
        <p className="text-mystic-muted text-sm mb-8">
          Погрузись в мир тайн и ответов
        </p>

        {/* Tarot cards fanning */}
        <div className="flex gap-[-8px] mb-8">
          {['🌙', '⭐', '✨', '🌟', '💫'].map((emoji, i) => (
            <div
              key={i}
              className="w-12 h-16 rounded-lg bg-gradient-to-br from-mystic-purple/60 to-mystic-blue/60 border border-mystic-accent/30 flex items-center justify-center text-lg glow"
              style={{
                transform: `rotate(${(i - 2) * 8}deg) translateY(${Math.abs(i - 2) * 4}px)`,
                animationDelay: `${i * 0.1}s`,
                marginLeft: i > 0 ? '-8px' : '0',
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-mystic-card rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-gold rounded-full animate-loading-bar" />
        </div>

        {/* Message */}
        <p className="text-mystic-muted text-sm animate-fade-in" key={msgIdx}>
          {MESSAGES_RU[msgIdx]}
        </p>
      </div>

      {/* Bottom crystals */}
      <div className="absolute bottom-8 flex gap-4 opacity-40">
        <span className="text-2xl" style={{ transform: 'rotate(-15deg)' }}>💎</span>
        <span className="text-xl" style={{ transform: 'rotate(10deg)' }}>🔮</span>
        <span className="text-2xl" style={{ transform: 'rotate(5deg)' }}>💎</span>
      </div>
    </div>
  );
}
