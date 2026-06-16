'use client';

import { useAppStore } from '@/store/app-store';
import ManaIcon from './ManaIcon';

/** Compact mana display for headers/nav */
export default function ManaBalance({ onClick }: { onClick?: () => void }) {
  const { user } = useAppStore();
  const mana = user?.mana ?? 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-mystic-card/80 border border-mystic-accent/20 rounded-full px-3 py-1.5 hover:border-mystic-accent/40 transition-colors"
    >
      <ManaIcon size="sm" />
      <span className="text-sm font-bold text-mystic-accent tabular-nums">{mana}</span>
    </button>
  );
}
