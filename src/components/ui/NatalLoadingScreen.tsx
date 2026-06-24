'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

interface Stage {
  icon: string;
  text: Record<L, string>;
  duration: number; // ms before moving to next
}

const STAGES: Stage[] = [
  {
    icon: '🌍',
    text: {
      ru: 'Определяем координаты места рождения...',
      uk: 'Визначаємо координати місця народження...',
      en: 'Locating birth coordinates...',
    },
    duration: 3000,
  },
  {
    icon: '🪐',
    text: {
      ru: 'Рассчитываем позиции планет и домов...',
      uk: 'Розраховуємо позиції планет і домів...',
      en: 'Calculating planet and house positions...',
    },
    duration: 4000,
  },
  {
    icon: '✨',
    text: {
      ru: 'Строим натальную карту...',
      uk: 'Будуємо натальну карту...',
      en: 'Building your natal chart...',
    },
    duration: 5000,
  },
  {
    icon: '🔮',
    text: {
      ru: '',
      uk: '',
      en: '',
    },
    duration: 999999, // stays until done
  },
];

const CYCLING_HINTS = [
  { icon: '✨', ru: 'Считываем вибрации рождения', uk: 'Зчитуємо вібрації народження', en: 'Reading birth vibrations' },
  { icon: '🌙', ru: 'Расшифровываем космические коды', uk: 'Розшифровуємо космічні коди', en: 'Decoding cosmic codes' },
  { icon: '⚡', ru: 'Синтезируем звёздный портрет', uk: 'Синтезуємо зоряний портрет', en: 'Synthesizing stellar portrait' },
  { icon: '🔮', ru: 'Активируем священное знание', uk: 'Активуємо священне знання', en: 'Activating sacred knowledge' },
  { icon: '🌟', ru: 'Узнаём голос вашей звезды', uk: 'Дізнаємось голос вашої зірки', en: 'Hearing your star\'s voice' },
  { icon: '💎', ru: 'Раскрываем кармический путь', uk: 'Розкриваємо кармічний шлях', en: 'Revealing the karmic path' },
];

const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export default function NatalLoadingScreen({ locale }: { locale: L }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);

  // Progress through stages
  useEffect(() => {
    if (stageIndex >= STAGES.length - 1) return;
    const timer = setTimeout(() => setStageIndex((i) => i + 1), STAGES[stageIndex].duration);
    return () => clearTimeout(timer);
  }, [stageIndex]);

  // Cycle through hints
  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % CYCLING_HINTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stage = STAGES[stageIndex];
  const hint = CYCLING_HINTS[hintIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-mystic-bg/95 backdrop-blur-sm px-6"
    >
      {/* Orbiting zodiac ring */}
      <div className="relative w-48 h-48 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          {ZODIAC_SYMBOLS.map((symbol, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x = 50 + 45 * Math.cos(angle);
            const y = 50 + 45 * Math.sin(angle);
            return (
              <span
                key={i}
                className="absolute text-lg opacity-30"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {symbol}
              </span>
            );
          })}
        </motion.div>

        {/* Center pulsing icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={stageIndex}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-5xl"
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="block"
              >
                {stage.icon}
              </motion.span>
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Glow ring */}
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-4 rounded-full border-2 border-mystic-accent/30"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 rounded-full border border-mystic-gold/20"
        />
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {STAGES.map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i <= stageIndex ? 'bg-mystic-accent' : 'bg-mystic-muted/30'
            }`}
            animate={i === stageIndex ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
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
    </motion.div>
  );
}
