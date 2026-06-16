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

const MESSAGES: Record<string, string[]> = {
  ru: ['Карты перемешиваются...', 'Связь с потусторонним...', 'Звёзды выстраиваются...', 'Энергия концентрируется...'],
  uk: ['Карти перемішуються...', 'Зв\'язок з потойбічним...', 'Зірки вишиковуються...', 'Енергія концентрується...'],
  en: ['Shuffling the cards...', 'Connecting to the beyond...', 'Stars are aligning...', 'Energy is focusing...'],
};

const SUBTITLE: Record<string, string> = {
  ru: 'Погрузись в мир тайн и ответов',
  uk: 'Поринь у світ таємниць і відповідей',
  en: 'Dive into the world of mysteries',
};

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [lang, setLang] = useState('ru');

  useEffect(() => {
    // Detect language from Telegram
    try {
      const tg = (window as any).Telegram?.WebApp;
      const lc = tg?.initDataUnsafe?.user?.language_code;
      if (lc === 'uk') setLang('uk');
      else if (lc !== 'ru' && lc !== 'be') setLang('en');
    } catch {}

    const t = setInterval(() => setMsgIdx((i) => (i + 1) % 4), 2000);
    return () => clearInterval(t);
  }, []);

  const msgs = MESSAGES[lang] || MESSAGES.ru;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-mystic-bg overflow-hidden z-[100]">
      {STARS.map((star) => (
        <div key={star.id} className="absolute rounded-full bg-mystic-accent star-particle"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size,
            '--duration': `${star.duration}s`, '--delay': `${star.delay}s` } as React.CSSProperties} />
      ))}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-mystic-purple/20 animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-mystic-blue/20 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-12 right-8 text-5xl animate-float-slow opacity-60">🌙</div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6">
          <div className="text-7xl animate-float">🔮</div>
          <div className="absolute -inset-4 rounded-full bg-mystic-accent/10 animate-pulse-glow" />
        </div>
        <h1 className="text-4xl font-bold font-mystic text-gradient-gold mb-2">Магия Карт</h1>
        <p className="text-mystic-muted text-sm mb-8">{SUBTITLE[lang]}</p>
        <div className="flex gap-[-8px] mb-8">
          {['🌙', '⭐', '✨', '🌟', '💫'].map((emoji, i) => (
            <div key={i} className="w-12 h-16 rounded-lg bg-gradient-to-br from-mystic-purple/60 to-mystic-blue/60 border border-mystic-accent/30 flex items-center justify-center text-lg glow"
              style={{ transform: `rotate(${(i - 2) * 8}deg) translateY(${Math.abs(i - 2) * 4}px)`, animationDelay: `${i * 0.1}s`, marginLeft: i > 0 ? '-8px' : '0' }}>
              {emoji}
            </div>
          ))}
        </div>
        <div className="w-48 h-1 bg-mystic-card rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-mystic-purple via-mystic-accent to-mystic-gold rounded-full animate-loading-bar" />
        </div>
        <p className="text-mystic-muted text-sm animate-fade-in" key={msgIdx}>{msgs[msgIdx]}</p>
      </div>

      <div className="absolute bottom-8 flex gap-4 opacity-40">
        <span className="text-2xl" style={{ transform: 'rotate(-15deg)' }}>💎</span>
        <span className="text-xl" style={{ transform: 'rotate(10deg)' }}>🔮</span>
        <span className="text-2xl" style={{ transform: 'rotate(5deg)' }}>💎</span>
      </div>
    </div>
  );
}
