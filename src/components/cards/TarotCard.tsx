'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface TarotCardProps {
  id: number;
  name: string;
  image: string;
  reversed: boolean;
  revealed: boolean;
  onClick?: () => void;
  delay?: number;
}

export default function TarotCard({ id, name, image, reversed, revealed, onClick, delay = 0 }: TarotCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (!revealed && !isFlipped) {
      setIsFlipped(true);
      onClick?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.4 }}
      className="card-container mx-auto w-[120px] h-[180px] cursor-pointer"
      onClick={handleClick}
    >
      <div className={`card-inner w-full h-full ${isFlipped || revealed ? 'flipped' : ''}`}>
        {/* Card back (face down) */}
        <div className="card-front glow bg-gradient-to-br from-mystic-purple to-mystic-blue rounded-xl border border-mystic-accent/30 flex items-center justify-center">
          <span className="text-3xl">🌟</span>
        </div>

        {/* Card front (face up) */}
        <div
          className={`card-back glow bg-mystic-card rounded-xl border border-mystic-accent/50 flex flex-col items-center justify-center p-2
            ${reversed ? 'rotate-180' : ''}`}
        >
          {/* Card image placeholder — replace with actual art */}
          <div className="w-full h-[120px] bg-gradient-to-b from-mystic-accent/20 to-transparent rounded-lg flex items-center justify-center text-2xl">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              '🃏'
            )}
          </div>
          <p className="mt-1 text-[10px] text-center text-mystic-accent font-mystic leading-tight">
            {name}
            {reversed && ' ↩️'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
