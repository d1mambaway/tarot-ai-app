'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { hapticMedium, hapticLight } from '@/lib/haptics';
import { playFlipSound } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

type L = 'ru' | 'uk' | 'en';

const CARD_T = {
  reversed: { ru: 'перевёрнутая', uk: 'перевернута', en: 'reversed' } as Record<L, string>,
  tapToClose: { ru: 'нажми чтобы закрыть', uk: 'натисни щоб закрити', en: 'tap to close' } as Record<L, string>,
};

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
  onReveal?: () => void;
  delay?: number;
  position?: string;
  keywords?: string[];
  size?: 'mini' | 'small' | 'normal';
}

export default function TarotCard({
  id, name, image, reversed, revealed, onClick, onReveal,
  delay = 0, position, keywords, size = 'normal',
}: TarotCardProps) {
  const locale = (useAppStore((s) => s.locale) || 'ru') as L;
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const isRevealed = revealed || isFlipped;

  const handleClick = () => {
    if (!isRevealed) {
      setIsFlipped(true);
      hapticMedium();
      playFlipSound();
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1200);
      onClick?.();
      onReveal?.();
    } else {
      hapticLight();
      setShowFullscreen(true);
    }
  };

  const isMajor = id <= 21;
  const suit = id <= 21 ? 'major' : id <= 35 ? 'wands' : id <= 49 ? 'cups' : id <= 63 ? 'swords' : 'pentacles';
  const gradient = CARD_COLORS[suit] || CARD_COLORS.major;
  const symbol = CARD_SYMBOLS[suit] || '✦';
  const hasImage = image && !image.includes('undefined');

  const isMini = size === 'mini';
  const isSmall = size === 'small';
  const w = isMini ? 'w-[68px]' : isSmall ? 'w-[90px]' : 'w-[110px]';
  const h = isMini ? 'h-[102px]' : isSmall ? 'h-[135px]' : 'h-[165px]';

  return (
    <>
      <div className="flex flex-col items-center">
        {/* Position label */}
        {position && !isMini && (
          <p className="text-[9px] text-mystic-muted mb-1 text-center max-w-[110px] truncate">
            {position}
          </p>
        )}

        {/* Card with 3D flip */}
        <div
          className={`${w} ${h} cursor-pointer ${!isRevealed ? 'animate-card-glow rounded-xl' : ''}`}
          style={{ perspective: 1200 }}
          onClick={handleClick}
        >
          <motion.div
            initial={false}
            animate={{ rotateY: isRevealed ? 180 : 0 }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 14,
              mass: 1,
            }}
            style={{
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              position: 'relative',
            }}
          >
            {/* Sparkle burst on flip */}
            {showSparkles && (
              <div className="card-sparkle-container">
                {Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i / 16) * Math.PI * 2;
                  const dist = 25 + Math.random() * 35;
                  return (
                    <div
                      key={i}
                      className="card-sparkle"
                      style={{
                        '--tx': `${Math.cos(angle) * dist}px`,
                        '--ty': `${Math.sin(angle) * dist}px`,
                        animationDelay: `${Math.random() * 0.3}s`,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            )}

            {/* ── Card back (visible by default) ── */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden glow"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <img
                src="/ui/card-back.png"
                alt="Card"
                className="w-full h-full object-cover"
              />
            </div>

            {/* ── Card face (visible after flip) ── */}
            <div
              className={`absolute inset-0 rounded-xl overflow-hidden border-2 border-mystic-accent/50 bg-gradient-to-b ${gradient} bg-mystic-card`}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className={`w-full h-full ${reversed ? 'rotate-180' : ''}`}>
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
                  <div className="flex flex-col items-center justify-between w-full h-full">
                    <div className={`${isMini ? 'text-[8px]' : 'text-[10px]'} text-mystic-accent/60 self-start p-2`}>
                      {isMajor ? `${id}` : ''}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className={isMini ? 'text-xl' : 'text-3xl'}>{symbol}</div>
                    </div>
                    <div className="w-full text-center p-1.5">
                      <p className={`${isMini ? 'text-[7px]' : isSmall ? 'text-[8px]' : 'text-[10px]'} text-mystic-accent font-mystic leading-tight font-bold`}>
                        {name}
                      </p>
                      {reversed && <span className="text-[8px] text-mystic-muted">↩️</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Keywords — shown after reveal */}
        {isRevealed && keywords && keywords.length > 0 && !isMini && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-1 text-center"
          >
            <p className="text-[9px] text-mystic-accent/80 leading-tight max-w-[110px] font-medium">
              {keywords.slice(0, 2).map(k => k.toUpperCase()).join(' • ')}
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Fullscreen card viewer (portal to body to escape transform/perspective ancestors) ── */}
      {typeof document !== 'undefined' && createPortal(
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
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-4 right-4 text-mystic-muted text-sm"
              >
                ✕
              </motion.div>

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
                    <span className="text-sm text-mystic-muted">↩️ {CARD_T.reversed[locale]}</span>
                  )}
                  {keywords && keywords.length > 0 && (
                    <p className="text-sm text-mystic-accent/70 mt-2 font-medium">
                      {keywords.map(k => k.toUpperCase()).join(' • ')}
                    </p>
                  )}
                  {position && (
                    <p className="text-xs text-mystic-accent/60 mt-1">{position}</p>
                  )}
                </motion.div>

                <p className="text-xs text-mystic-muted/50 mt-6 animate-pulse">
                  {CARD_T.tapToClose[locale]}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
