/**
 * Achievements — shared by the profile UI and /api/achievements, so the
 * server checks the same conditions and pays the same reward it shows.
 */

type L3 = { ru: string; uk: string; en: string };

export interface AchievementStats {
  readingsCount: number;
  cardsCollected: number;
  streakDays: number;
  majorCollected: number;
}

export interface Achievement {
  id: string;
  icon: string;
  name: L3;
  desc: L3;
  check: (stats: AchievementStats) => boolean;
  reward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
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


export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
