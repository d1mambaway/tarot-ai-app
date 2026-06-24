'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

const CYCLING_HINTS = [
  { icon: '✨', ru: 'Считываем вибрации рождения', uk: 'Зчитуємо вібрації народження', en: 'Reading birth vibrations' },
  { icon: '🌙', ru: 'Расшифровываем космические коды', uk: 'Розшифровуємо космічні коди', en: 'Decoding cosmic codes' },
  { icon: '⚡', ru: 'Синтезируем звёздный портрет', uk: 'Синтезуємо зоряний портрет', en: 'Synthesizing stellar portrait' },
  { icon: '🔮', ru: 'Активируем священное знание', uk: 'Активуємо священне знання', en: 'Activating sacred knowledge' },
  { icon: '🌟', ru: 'Узнаём голос вашей звезды', uk: 'Дізнаємось голос вашої зірки', en: 'Hearing your star\'s voice' },
  { icon: '💎', ru: 'Раскрываем кармический путь', uk: 'Розкриваємо кармічний шлях', en: 'Revealing the karmic path' },
];

export default function NatalLoadingScreen({ locale }: { locale: L }) {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % CYCLING_HINTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const hint = CYCLING_HINTS[hintIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mystic-bg"
    >
      {/* Orbital animation — slightly smaller, shifted up */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute left-0 right-0 w-full object-cover"
        style={{ mixBlendMode: 'lighten', top: '10%', height: '55%' }}
        src="/animations/natal-loading.mp4"
      />

      {/* Bottom area: dots + hints */}
      <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center px-6">
        {/* Progress dots */}
        <div className="flex gap-2 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-mystic-accent"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Cycling hint text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={hintIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6 }}
            className="text-mystic-muted text-sm text-center"
          >
            {hint.icon} {hint[locale]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
