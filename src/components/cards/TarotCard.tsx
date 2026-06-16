'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// CSS-based card imagery (no real images yet)
const CARD_COLORS: Record<string, string> = {
  major: 'from-mystic-purple/60 to-mystic-blue/60',
  wands: 'from-red-900/50 to-orange-900/50',
  cups: 'from-blue-900/50 to-cyan-900/50',
  swords: 'from-slate-700/50 to-zinc-800/50',
  pentacles: 'from-yellow-900/50 to-green-900/50',
};

const CARD_SYMBOLS: Record<string, string> = {
  major: '✦',
  wands: '🪄',
  cups: '🏆',
  swords: '⚔️',
  pentacles: '⭐',
};

interface TarotCardProps {
  id: number;
  name: string;
  image: string;
  reversed: boolean;
  revealed: boolean;
  onClick?: () => void;
  delay?: number;
  position?: string;
  keywords?: string[];
  size?: 'small' | 'normal';
}

export default function TarotCard({ id, name, image, reversed, revealed, onClick, delay = 0, position, keywords, size = 'normal' }: TarotCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (!revealed && !isFlipped) {
      setIsFlipped(true);
      onClick?.();
    }
  };

  const isMajor = id <= 21;
  const suit = id <= 21 ? 'major' : id <= 35 ? 'wands' : id <= 49 ? 'cups' : id <= 63 ? 'swords' : 'pentacles';
  const gradient = CARD_COLORS[suit] || CARD_COLORS.major;
  const symbol = CARD_SYMBOLS[suit] || '✦';

  const isSmall = size === 'small';
  const w = isSmall ? 'w-[90px]' : 'w-[110px]';
  const h = isSmall ? 'h-[135px]' : 'h-[165px]';

  return (
    <div className="flex flex-col items-center">
      {/* Position label */}
      {position && (
        <p className="text-[9px] text-mystic-muted mb-1 text-center max-w-[110px] truncate">
          {position}
        </p>
      )}

      <div
        className={`card-container ${w} ${h} cursor-pointer`}
        onClick={handleClick}
      >
        <div className={`card-inner w-full h-full ${isFlipped || revealed ? 'flipped' : ''}`}>
          {/* Card back */}
          <div className="card-front bg-gradient-to-br from-mystic-purple to-mystic-blue rounded-xl border-2 border-mystic-accent/40 flex items-center justify-center card-back-pattern glow">
            <div className="text-center">
              <div className="text-2xl mb-1 animate-pulse">✨</div>
              <div className="w-8 h-8 rounded-full border border-mystic-accent/50 flex items-center justify-center mx-auto">
                <span className="text-mystic-accent text-xs">☽</span>
              </div>
            </div>
          </div>

          {/* Card front */}
          <div
            className={`card-back rounded-xl border-2 border-mystic-accent/50 flex flex-col items-center justify-between p-2 bg-gradient-to-b ${gradient} bg-mystic-card overflow-hidden ${reversed ? 'rotate-180' : ''}`}
          >
            {/* Top decoration */}
            <div className="text-[10px] text-mystic-accent/60 self-start">
              {isMajor ? `${id}` : ''}
            </div>

            {/* Center symbol */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-3xl">
                {symbol}
              </div>
            </div>

            {/* Card name */}
            <div className="w-full text-center">
              <p className={`${isSmall ? 'text-[8px]' : 'text-[10px]'} text-mystic-accent font-mystic leading-tight font-bold`}>
                {name}
              </p>
              {reversed && (
                <span className="text-[8px] text-mystic-muted">↩️</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {revealed && keywords && keywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-1 text-center"
        >
          <p className="text-[8px] text-mystic-muted leading-tight max-w-[110px]">
            {keywords.slice(0, 2).join(' • ')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
