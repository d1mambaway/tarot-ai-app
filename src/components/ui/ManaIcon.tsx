'use client';

import Image from 'next/image';

interface ManaIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { px: 16, src: '/ui/mana-sm.png' },
  md: { px: 24, src: '/ui/mana.png' },
  lg: { px: 48, src: '/ui/mana-lg.png' },
};

export default function ManaIcon({ size = 'md', className = '' }: ManaIconProps) {
  const s = SIZES[size];
  return (
    <Image
      src={s.src}
      alt="Мана"
      width={s.px}
      height={s.px}
      className={`inline-block ${className}`}
      unoptimized
    />
  );
}
