'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, type AchievementStats } from '@/data/achievements';
import { useAppStore } from '@/store/app-store';
import { hapticSuccess } from '@/lib/haptics';
import { Icon, IconBadge } from './Icon';
import ManaIcon from './ManaIcon';
import { Crown, Flame, Layers, Lock, Sparkles, Star, Trophy, WandSparkles, type LucideIcon } from 'lucide-react';

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  first_reading: Sparkles,
  '10_readings': Star,
  '50_readings': WandSparkles,
  streak_7: Flame,
  streak_30: Crown,
  collect_10: Layers,
  all_major: Sparkles,
  collect_all: Trophy,
};

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Достижения', uk: 'Досягнення', en: 'Achievements' },
  reward: { ru: 'награда', uk: 'нагорода', en: 'reward' },
  unlocked: { ru: 'Получено!', uk: 'Отримано!', en: 'Unlocked!' },
  claim: { ru: 'Забрать', uk: 'Забрати', en: 'Claim' },
  ready: { ru: 'Награда ждёт!', uk: 'Нагорода чекає!', en: 'Reward ready!' },
  locked: { ru: 'Не открыто', uk: 'Не відкрито', en: 'Locked' },
};

export default function AchievementsSection({ 
  readingsCount, cardsCollected, streakDays, locale 
}: { 
  readingsCount: number; cardsCollected: number[]; streakDays: number; locale: string;
}) {
  const l = (locale || 'ru') as L;
  const { user, setMana, patchUser } = useAppStore();
  const claimedIds = user?.achievementsClaimed ?? [];
  const [claiming, setClaiming] = useState<string | null>(null);

  const claim = async (id: string) => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initData || claiming) return;
    setClaiming(id);
    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, id }),
      });
      const data = await res.json();
      if (data.ok) {
        setMana(data.newMana);
        patchUser({ achievementsClaimed: data.achievementsClaimed });
        if (data.credited) hapticSuccess();
      }
    } catch {
      /* ignore — the button stays and can be tapped again */
    } finally {
      setClaiming(null);
    }
  };

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
      <h3 className="text-[15px] font-bold text-mystic-gold font-mystic mb-3 flex items-center gap-2">
        <Icon icon={Trophy} size={18} /> {T.title[l]} <span className="text-mystic-muted font-normal">{unlocked.length}/{ACHIEVEMENTS.length}</span>
      </h3>
      <div className="space-y-2">
        {unlocked.map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-mystic-accent/10 rounded-xl p-2.5 border border-mystic-accent/20">
            <IconBadge icon={ACHIEVEMENT_ICONS[a.id] ?? Star} size={34} />
            <div className="flex-1">
              <p className="text-xs font-bold text-mystic-accent">{a.name[l]}</p>
              <p className="text-[10px] text-green-400">
                {claimedIds.includes(a.id) ? T.unlocked[l] : T.ready[l]}
              </p>
            </div>
            {claimedIds.includes(a.id) ? (
              <span className="text-[11px] text-mystic-gold font-bold flex items-center gap-0.5">+{a.reward} <ManaIcon size="sm" /></span>
            ) : (
              <button
                onClick={() => claim(a.id)}
                disabled={claiming === a.id}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-mystic-gold to-amber-500 text-mystic-bg disabled:opacity-60 animate-badge-pulse"
              >
                {claiming === a.id ? '…' : `${T.claim[l]} +${a.reward}`}
              </button>
            )}
          </div>
        ))}
        {locked.slice(0, 3).map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-mystic-bg/40 rounded-xl p-2.5 opacity-50">
            <IconBadge icon={Lock} size={34} tone="muted" />
            <div className="flex-1">
              <p className="text-xs font-bold text-mystic-text/60">{a.name[l]}</p>
              <p className="text-[10px] text-mystic-muted">{a.desc[l]}</p>
            </div>
            <span className="text-[11px] text-mystic-muted flex items-center gap-0.5">{a.reward} <ManaIcon size="sm" /></span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
