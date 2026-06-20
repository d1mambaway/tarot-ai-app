'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const MESSAGES: Record<string, string[]> = {
  ru: [
    'Тасуем колоду судьбы…',
    'Выстраиваем созвездия…',
    'Открываем астральные врата…',
    'Настраиваем энергетические потоки…',
    'Пробуждаем лунную магию…',
    'Считываем космические вибрации…',
    'Зажигаем мистический огонь…',
    'Призываем духов карт…',
  ],
  uk: [
    "Тасуємо колоду долі…",
    "Вибудовуємо сузір'я…",
    "Відкриваємо астральні брами…",
    "Налаштовуємо енергетичні потоки…",
    "Пробуджуємо місячну магію…",
    "Зчитуємо космічні вібрації…",
    "Запалюємо містичний вогонь…",
    "Кличемо духів карт…",
  ],
  en: [
    'Shuffling the deck of fate…',
    'Aligning the constellations…',
    'Opening astral gates…',
    'Tuning the energy flows…',
    'Awakening lunar magic…',
    'Reading cosmic vibrations…',
    'Igniting the mystic flame…',
    'Summoning the card spirits…',
  ],
};

// Sparkle particles
const SPARKLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${5 + Math.random() * 75}%`,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 2.5 + 2,
  delay: Math.random() * 4,
  isGold: Math.random() > 0.4,
}));

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [lang, setLang] = useState('ru');
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const lc = tg?.initDataUnsafe?.user?.language_code;
      if (lc === 'uk') setLang('uk');
      else if (lc !== 'ru' && lc !== 'be') setLang('en');
    } catch {}

    requestAnimationFrame(() => setShow(true));

    const t = setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.ru.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  const msgs = MESSAGES[lang] || MESSAGES.ru;

  return (
    <div className="fixed inset-0 bg-[#080515] overflow-hidden z-[100]">
      {/* ── Full-screen artwork ── */}
      <div
        className="absolute inset-0 transition-all duration-[2500ms] ease-out animate-loading-breathe"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'scale(1)' : 'scale(1.08)',
        }}
      >
        <Image
          src="/ui/loading-screen.png"
          alt="Магия Карт"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>

      {/* ── Golden shimmer sweep ── */}
      <div
        className="absolute inset-0 animate-shimmer-sweep pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.07) 45%, rgba(255,215,0,0.15) 50%, rgba(255,215,0,0.07) 55%, transparent 60%)',
        }}
      />

      {/* ── Floating sparkle particles ── */}
      {SPARKLES.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full animate-sparkle-drift pointer-events-none"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: s.isGold
              ? 'radial-gradient(circle, rgba(255,215,0,0.9), transparent)'
              : 'radial-gradient(circle, rgba(168,85,247,0.8), transparent)',
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* ── Animated bar fill — positioned over the image's bar frame ──
           Image bar frame: y=1395-1418 (fill area), x=233-674
           As percentage of 941×1672 image:
             top: 83.4%, height: 1.38%
             left: 24.8%, width: 46.9%
           Since object-cover centers, horizontal centering works.
      ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '83.4%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '47%',
          height: '1.4%',
        }}
      >
        <div
          className="h-full rounded-sm"
          style={{
            background: 'linear-gradient(90deg, #3B2560, #6E4F73, #A07850, #D4AF37, #F0D68A)',
            boxShadow: '0 0 12px rgba(212,175,55,0.4), 0 0 24px rgba(212,175,55,0.2)',
            animation: show
              ? 'bar-fill 3.5s ease-out forwards, bar-glow 2s ease-in-out 1s infinite'
              : 'none',
          }}
        />
      </div>

      {/* ── Cycling status message — positioned where "Загрузка..." was ── */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          top: '79.5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
        }}
      >
        <p
          className="text-amber-200/80 text-[11px] font-light tracking-[0.18em] uppercase text-center animate-fade-in"
          key={msgIdx}
        >
          {msgs[msgIdx]}
        </p>
      </div>
    </div>
  );
}
