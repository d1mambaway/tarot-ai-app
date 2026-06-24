'use client';

import { useAppStore } from '@/store/app-store';
import ManaIcon from './ManaIcon';

/** Compact mana display for headers/nav */
export default function ManaBalance({ onClick }: { onClick?: () => void }) {
  const { user } = useAppStore();
  const mana = user?.mana ?? 0;
  const isPremium = user?.isPremium ?? false;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
        isPremium
          ? 'bg-gradient-to-r from-mystic-gold/20 to-mystic-accent/20 border border-mystic-gold/40 hover:border-mystic-gold/60'
          : 'bg-mystic-card/80 border border-mystic-accent/20 hover:border-mystic-accent/40'
      }`}
    >
      {isPremium ? (
        <span className="text-sm">👑</span>
      ) : (
        <ManaIcon size="sm" />
      )}
      <span className={`text-sm font-bold tabular-nums ${
        isPremium ? 'text-mystic-gold' : 'text-mystic-accent'
      }`}>
        {isPremium ? '∞' : mana}
      </span>
    </button>
  );
}
