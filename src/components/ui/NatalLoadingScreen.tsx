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
      ru: 'Составляем глубокую интерпретацию...',
      uk: 'Складаємо глибоку інтерпретацію...',
      en: 'Crafting deep interpretation...',
    },
    duration: 999999, // stays until done
  },
];

const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export default function NatalLoadingScreen({ locale }: { locale: L }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Progress through stages
  useEffect(() => {
    if (stageIndex >= STAGES.length - 1) return;
    const timer = setTimeout(() => setStageIndex((i) => i + 1), STAGES[stageIndex].duration);
    return () => clearTimeout(timer);
  }, [stageIndex]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stage = STAGES[stageIndex];

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

      {/* Stage text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="text-mystic-text text-center font-mystic text-lg mb-4"
        >
          {stage.text[locale]}
        </motion.p>
      </AnimatePresence>

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

      {/* Subtle hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 8 }}
        className="text-mystic-muted text-xs text-center"
      >
        {locale === 'ru' ? 'Рисуем карту небес на момент твоего рождения' + dots
          : locale === 'uk' ? 'Малюємо карту небес на момент твого народження' + dots
            : 'Drawing the sky map at the moment of your birth' + dots}
      </motion.p>
    </motion.div>
  );
}
