'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

interface MoonPhaseInfo {
  phase: string;
  emoji: string;
  name: { ru: string; uk: string; en: string };
  advice: { ru: string; uk: string; en: string };
  illumination: number;
}

function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  // Synodic month = 29.53059 days
  const SYNODIC = 29.53059;
  // Known new moon: January 6, 2000 18:14 UTC
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();
  const diff = date.getTime() - KNOWN_NEW_MOON;
  const days = diff / (1000 * 60 * 60 * 24);
  const cycle = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = Math.round((1 - Math.cos((cycle / SYNODIC) * 2 * Math.PI)) / 2 * 100);

  if (cycle < 1.85) return { phase: 'new', emoji: '🌑', illumination, name: { ru: 'Новолуние', uk: 'Новомісяця', en: 'New Moon' }, advice: { ru: 'Идеальное время для новых начинаний и намерений', uk: 'Ідеальний час для нових починань та намірів', en: 'Perfect time for new beginnings and intentions' } };
  if (cycle < 7.38) return { phase: 'waxing_crescent', emoji: '🌒', illumination, name: { ru: 'Растущий полумесяц', uk: 'Зростаючий півмісяць', en: 'Waxing Crescent' }, advice: { ru: 'Время действовать и строить планы', uk: 'Час діяти та будувати плани', en: 'Time to act and build plans' } };
  if (cycle < 11.07) return { phase: 'first_quarter', emoji: '🌓', illumination, name: { ru: 'Первая четверть', uk: 'Перша чверть', en: 'First Quarter' }, advice: { ru: 'Время решений и преодоления препятствий', uk: 'Час рішень та подолання перешкод', en: 'Time for decisions and overcoming obstacles' } };
  if (cycle < 14.77) return { phase: 'waxing_gibbous', emoji: '🌔', illumination, name: { ru: 'Растущая луна', uk: 'Зростаючий місяць', en: 'Waxing Gibbous' }, advice: { ru: 'Энергия растёт — доводи дела до конца', uk: 'Енергія зростає — доводь справи до кінця', en: 'Energy is rising — finish what you started' } };
  if (cycle < 16.61) return { phase: 'full', emoji: '🌕', illumination, name: { ru: 'Полнолуние', uk: 'Повний місяць', en: 'Full Moon' }, advice: { ru: 'Пик энергии! Лучшее время для раскладов на отношения', uk: 'Пік енергії! Найкращий час для розкладів на відносини', en: 'Peak energy! Best time for relationship readings' } };
  if (cycle < 22.15) return { phase: 'waning_gibbous', emoji: '🌖', illumination, name: { ru: 'Убывающая луна', uk: 'Спадний місяць', en: 'Waning Gibbous' }, advice: { ru: 'Время благодарности и осмысления', uk: 'Час вдячності та осмислення', en: 'Time for gratitude and reflection' } };
  if (cycle < 25.84) return { phase: 'last_quarter', emoji: '🌗', illumination, name: { ru: 'Последняя четверть', uk: 'Остання чверть', en: 'Last Quarter' }, advice: { ru: 'Отпускай старое, освобождай место для нового', uk: 'Відпускай старе, звільняй місце для нового', en: 'Let go of the old, make room for the new' } };
  return { phase: 'waning_crescent', emoji: '🌘', illumination, name: { ru: 'Убывающий полумесяц', uk: 'Спадний півмісяць', en: 'Waning Crescent' }, advice: { ru: 'Время отдыха и медитации перед новым циклом', uk: 'Час відпочинку та медитації перед новим циклом', en: 'Time to rest and meditate before a new cycle' } };
}

export default function MoonPhaseWidget({ locale }: { locale: string }) {
  const l = (locale || 'ru') as L;
  const moon = useMemo(() => getMoonPhase(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-mystic-card via-mystic-blue/20 to-mystic-card border border-mystic-blue/25 aura-blue"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{moon.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-mystic-accent font-mystic">{moon.name[l]}</p>
          <p className="text-[11px] text-mystic-muted mt-0.5">{moon.advice[l]}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mystic-accent/80 font-bold">{moon.illumination}%</p>
          <p className="text-[9px] text-mystic-muted">☽</p>
        </div>
      </div>
    </motion.div>
  );
}
