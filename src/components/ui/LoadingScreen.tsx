'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const MESSAGES: Record<string, string[]> = {
  ru: ['Карты перемешиваются...', 'Связь с потусторонним...', 'Звёзды выстраиваются...', 'Энергия концентрируется...', 'Врата открываются...'],
  uk: ['Карти перемішуються...', 'Зв\'язок з потойбічним...', 'Зірки вишиковуються...', 'Енергія концентрується...', 'Брама відчиняється...'],
  en: ['Shuffling the cards...', 'Connecting to the beyond...', 'Stars are aligning...', 'Energy is focusing...', 'The gates are opening...'],
};

// Generate sparkle particles
const SPARKLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 2 + 1.5,
  delay: Math.random() * 3,
}));

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [lang, setLang] = useState('ru');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Detect language from Telegram
    try {
      const tg = (window as any).Telegram?.WebApp;
      const lc = tg?.initDataUnsafe?.user?.language_code;
      if (lc === 'uk') setLang('uk');
      else if (lc !== 'ru' && lc !== 'be') setLang('en');
    } catch {}

    // Trigger entrance animation
    requestAnimationFrame(() => setShow(true));

    const t = setInterval(() => setMsgIdx((i) => (i + 1) % 5), 1800);
    return () => clearInterval(t);
  }, []);

  const msgs = MESSAGES[lang] || MESSAGES.ru;

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-[#0a0518] overflow-hidden z-[100]">
      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-transparent to-transparent" />

      {/* Main image — takes up all space except bottom strip */}
      <div
        className="relative w-full flex-1 flex items-end justify-center transition-all duration-[2000ms] ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'scale(1)' : 'scale(1.1)',
        }}
      >
        {/* Golden glow behind image */}
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="w-[80%] h-[70%] rounded-3xl bg-gradient-radial from-amber-500/15 via-purple-500/10 to-transparent animate-pulse-glow" />
        </div>

        {/* The image */}
        <div className="relative w-[80%] max-w-sm aspect-[9/16] animate-loading-float">
          <Image
            src="/ui/loading-screen.png"
            alt="Магия Карт"
            fill
            className="object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]"
            priority
            unoptimized
          />

          {/* Golden shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 animate-shimmer-sweep"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.12) 45%, rgba(255,215,0,0.25) 50%, rgba(255,215,0,0.12) 55%, transparent 60%)',
              }}
            />
          </div>

          {/* Corner glow accents */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-amber-400/30 rounded-full blur-lg animate-pulse" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-400/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-purple-400/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Floating sparkle particles */}
        {SPARKLES.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full animate-sparkle-float"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              background: `radial-gradient(circle, ${Math.random() > 0.5 ? 'rgba(255,215,0,0.9)' : 'rgba(168,85,247,0.9)'}, transparent)`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Bottom strip: loading bar + message — between image and TG frame */}
      <div
        className="relative z-10 w-full px-6 py-4 flex flex-col items-center gap-2.5 transition-all duration-[1500ms] ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(15px)',
          transitionDelay: '500ms',
        }}
      >
        {/* Decorative line separator */}
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mb-0.5" />

        {/* Loading bar */}
        <div className="w-52 h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <div className="h-full rounded-full animate-loading-bar"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #a855f7, #d4a017, #a855f7, #7c3aed)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Cycling message */}
        <p className="text-purple-200/60 text-[11px] font-light tracking-widest uppercase animate-fade-in" key={msgIdx}>
          {msgs[msgIdx]}
        </p>
      </div>
    </div>
  );
}
