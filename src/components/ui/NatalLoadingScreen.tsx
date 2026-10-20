'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeaveSpinner } from '@/components/ui/weave-spinner';

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mystic-bg px-6"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(60% 40% at 50% 45%, rgba(123, 92, 220, 0.16), transparent 70%)' }}
      />

      <WeaveSpinner size={180} />

      {/* Cycling hint text */}
      <div className="h-6 mt-12">
        <AnimatePresence mode="wait">
          <motion.p
            key={hintIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.7, y: 0 }}
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
