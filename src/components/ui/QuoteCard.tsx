'use client';

/**
 * Quote of the launch: a new one every time the app opens, no repeats until
 * the whole pool has been shown. Words surface from a soft blur.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { nextQuoteIndex, quoteAt } from '@/data/quotes';

type L = 'ru' | 'uk' | 'en';

// One quote per app launch: returning to Home keeps the same quote
let launchQuote: number | null = null;

export default function QuoteCard({ locale }: { locale: L }) {
  const [idx, setIdx] = useState<number | null>(null);

  // Picked on the client once per launch (keeps SSR markup stable)
  useEffect(() => {
    if (launchQuote === null) launchQuote = nextQuoteIndex();
    setIdx(launchQuote);
  }, []);

  if (idx === null) return <div className="mb-4 h-[112px]" />;

  const words = quoteAt(idx, locale).split(' ');

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.6 }}
      className="relative mb-4 px-6 pt-6 pb-5 rounded-3xl quote-card overflow-hidden"
    >
      <span aria-hidden className="quote-mark">“</span>
      <blockquote className="relative font-display italic text-[19px] leading-[1.45] text-center quote-text">
        {words.map((w, i) => (
          <motion.span
            key={`${idx}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, filter: 'blur(6px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ delay: 0.45 + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </blockquote>
      <div aria-hidden className="mt-3 flex items-center justify-center gap-2 text-[10px] text-mystic-gold/50">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-mystic-gold/40" />
        ✦
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-mystic-gold/40" />
      </div>
    </motion.figure>
  );
}
