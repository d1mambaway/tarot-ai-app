'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

type L = 'ru' | 'uk' | 'en';

interface Achievement {
  id: string;
  icon: string;
  name: { ru: string; uk: string; en: string };
  desc: { ru: string; uk: string; en: string };
  check: (stats: AchievementStats) => boolean;
  reward: number;
}

interface AchievementStats {
  readingsCount: number;
  cardsCollected: number;
  streakDays: number;
  majorCollected: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_reading', icon: '🔮', reward: 100,
    name: { ru: 'Первый расклад', uk: 'Перший розклад', en: 'First Reading' },
    desc: { ru: 'Сделай свой первый расклад', uk: 'Зроби свій перший розклад', en: 'Do your first reading' },
    check: (s) => s.readingsCount >= 1,
  },
  {
    id: '10_readings', icon: '⭐', reward: 300,
    name: { ru: '10 раскладов', uk: '10 розкладів', en: '10 Readings' },
    desc: { ru: 'Сделай 10 раскладов', uk: 'Зроби 10 розкладів', en: 'Complete 10 readings' },
    check: (s) => s.readingsCount >= 10,
  },
  {
    id: '50_readings', icon: '💫', reward: 1000,
    name: { ru: 'Мастер карт', uk: 'Майстер карт', en: 'Card Master' },
    desc: { ru: 'Сделай 50 раскладов', uk: 'Зроби 50 розкладів', en: 'Complete 50 readings' },
    check: (s) => s.readingsCount >= 50,
  },
  {
    id: 'streak_7', icon: '🔥', reward: 500,
    name: { ru: 'Неделя магии', uk: 'Тиждень магії', en: 'Magic Week' },
    desc: { ru: 'Заходи 7 дней подряд', uk: 'Заходь 7 днів поспіль', en: '7 day streak' },
    check: (s) => s.streakDays >= 7,
  },
  {
    id: 'streak_30', icon: '👑', reward: 2000,
    name: { ru: 'Месяц силы', uk: 'Місяць сили', en: 'Month of Power' },
    desc: { ru: 'Заходи 30 дней подряд', uk: 'Заходь 30 днів поспіль', en: '30 day streak' },
    check: (s) => s.streakDays >= 30,
  },
  {
    id: 'collect_10', icon: '🃏', reward: 200,
    name: { ru: 'Собиратель', uk: 'Збирач', en: 'Collector' },
    desc: { ru: 'Собери 10 карт', uk: 'Збери 10 карт', en: 'Collect 10 cards' },
    check: (s) => s.cardsCollected >= 10,
  },
  {
    id: 'all_major', icon: '✨', reward: 3000,
    name: { ru: 'Все Арканы', uk: 'Всі Аркани', en: 'All Arcana' },
    desc: { ru: 'Собери все 22 старших аркана', uk: 'Збери всі 22 старших аркани', en: 'Collect all 22 Major Arcana' },
    check: (s) => s.majorCollected >= 22,
  },
  {
    id: 'collect_all', icon: '🏆', reward: 5000,
    name: { ru: 'Полная колода', uk: 'Повна колода', en: 'Full Deck' },
    desc: { ru: 'Собери все 78 карт', uk: 'Збери всі 78 карт', en: 'Collect all 78 cards' },
    check: (s) => s.cardsCollected >= 78,
  },
];

const T = {
  title: { ru: 'Достижения', uk: 'Досягнення', en: 'Achievements' },
  reward: { ru: 'награда', uk: 'нагорода', en: 'reward' },
  unlocked: { ru: 'Получено!', uk: 'Отримано!', en: 'Unlocked!' },
  locked: { ru: 'Не открыто', uk: 'Не відкрито', en: 'Locked' },
};

export default function AchievementsSection({ 
  readingsCount, cardsCollected, streakDays, locale 
}: { 
  readingsCount: number; cardsCollected: number[]; streakDays: number; locale: string;
}) {
  const l = (locale || 'ru') as L;
  const majorCollected = cardsCollected.filter(id => id <= 21).length;
  
  const stats: AchievementStats = {
    readingsCount,
    cardsCollected: cardsCollected.length,
    streakDays,
    majorCollected,
  };
  
  const { unlocked, locked } = useMemo(() => {
    const u = ACHIEVEMENTS.filter(a => a.check(stats));
    const lo = ACHIEVEMENTS.filter(a => !a.check(stats));
    return { unlocked: u, locked: lo };
  }, [stats.readingsCount, stats.cardsCollected, stats.streakDays, stats.majorCollected]);
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-mystic-card/80 rounded-2xl p-4 border border-mystic-accent/20 mb-4 aura-purple">
      <h3 className="text-sm font-bold text-mystic-accent font-mystic mb-3">
        🏆 {T.title[l]} ({unlocked.length}/{ACHIEVEMENTS.length})
      </h3>
      <div className="space-y-2">
        {unlocked.map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-mystic-accent/10 rounded-xl p-2.5 border border-mystic-accent/20">
            <span className="text-xl">{a.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-mystic-accent">{a.name[l]}</p>
              <p className="text-[10px] text-green-400">✅ {T.unlocked[l]}</p>
            </div>
            <span className="text-[10px] text-mystic-gold font-bold">+{a.reward} 💎</span>
          </div>
        ))}
        {locked.slice(0, 3).map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-mystic-bg/40 rounded-xl p-2.5 opacity-50">
            <span className="text-xl grayscale">{a.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-mystic-text/60">{a.name[l]}</p>
              <p className="text-[10px] text-mystic-muted">{a.desc[l]}</p>
            </div>
            <span className="text-[10px] text-mystic-muted">{a.reward} 💎</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
