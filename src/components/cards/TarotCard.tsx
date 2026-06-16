'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleClick = () => {
    if (!revealed && !isFlipped) {
      setIsFlipped(true);
      onClick?.();
    } else if (revealed || isFlipped) {
      // Card already revealed — open fullscreen view
      setShowFullscreen(true);
    }
  };

  const isMajor = id <= 21;
  const suit = id <= 21 ? 'major' : id <= 35 ? 'wands' : id <= 49 ? 'cups' : id <= 63 ? 'swords' : 'pentacles';
  const gradient = CARD_COLORS[suit] || CARD_COLORS.major;
  const symbol = CARD_SYMBOLS[suit] || '✦';
  const hasImage = image && !image.includes('undefined');

  const isSmall = size === 'small';
  const w = isSmall ? 'w-[90px]' : 'w-[110px]';
  const h = isSmall ? 'h-[135px]' : 'h-[165px]';

  return (
    <>
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
              className={`card-back rounded-xl border-2 border-mystic-accent/50 flex flex-col items-center justify-between bg-gradient-to-b ${gradient} bg-mystic-card overflow-hidden ${reversed ? 'rotate-180' : ''}`}
            >
              {hasImage ? (
                <div className="w-full h-full relative">
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
                  />
                  {reversed && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rotate-180">
                      <span className="text-[8px] bg-black/60 text-mystic-accent px-1 rounded">↩️</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-[10px] text-mystic-accent/60 self-start p-2">
                    {isMajor ? `${id}` : ''}
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-3xl">{symbol}</div>
                  </div>
                  <div className="w-full text-center p-2">
                    <p className={`${isSmall ? 'text-[8px]' : 'text-[10px]'} text-mystic-accent font-mystic leading-tight font-bold`}>
                      {name}
                    </p>
                    {reversed && <span className="text-[8px] text-mystic-muted">↩️</span>}
                  </div>
                </>
              )}
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

      {/* Fullscreen card viewer */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6"
            onClick={() => setShowFullscreen(false)}
          >
            {/* Close hint */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-4 right-4 text-mystic-muted text-sm"
            >
              ✕
            </motion.div>

            {/* Card image */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {hasImage ? (
                <div className={`max-w-[280px] max-h-[420px] ${reversed ? 'rotate-180' : ''}`}>
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-contain rounded-2xl drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                  />
                </div>
              ) : (
                <div className={`w-[200px] h-[300px] rounded-2xl border-2 border-mystic-accent/50 bg-gradient-to-b ${gradient} flex items-center justify-center ${reversed ? 'rotate-180' : ''}`}>
                  <span className="text-6xl">{symbol}</span>
                </div>
              )}

              {/* Card name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 text-center"
              >
                <h3 className="text-xl font-bold text-mystic-accent font-mystic">
                  {name}
                </h3>
                {reversed && (
                  <span className="text-sm text-mystic-muted">↩️ перевёрнутая</span>
                )}
                {keywords && keywords.length > 0 && (
                  <p className="text-sm text-mystic-muted mt-2">
                    {keywords.join(' • ')}
                  </p>
                )}
                {position && (
                  <p className="text-xs text-mystic-accent/60 mt-1">
                    {position}
                  </p>
                )}
              </motion.div>

              {/* Tap to close */}
              <p className="text-xs text-mystic-muted/50 mt-6 animate-pulse">
                нажми чтобы закрыть
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
