'use client';

/**
 * Asks for the birth date once, saves it to the profile and unlocks the
 * personal moon line. Uses the native date picker (best on phones).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { MOON_UI } from '@/data/moon-texts';
import { signKeyFromBirthDate } from '@/lib/zodiac';
import { hapticLight, hapticSuccess, hapticWarning } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

interface Props {
  locale: L;
  /** Pre-filled value when correcting an existing date */
  initial?: string;
  onSaved?: () => void;
  /** Shown only when editing an existing date */
  onCancel?: () => void;
}

export default function BirthDateCard({ locale, initial = '', onSaved, onCancel }: Props) {
  const l = locale;
  const { setBirthInfo } = useAppStore();
  const [editing, setEditing] = useState(!!onCancel);
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const save = async () => {
    const sign = signKeyFromBirthDate(value);
    if (!sign || status === 'saving') return;
    setStatus('saving');
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || '';
    try {
      if (initData) {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, birthDate: value }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setBirthInfo(data.birthDate || value, data.zodiacSign || sign);
      } else {
        // Outside Telegram (dev preview) keep it local
        setBirthInfo(value, sign);
      }
      hapticSuccess();
      setStatus('idle');
      onSaved?.();
    } catch {
      hapticWarning();
      setStatus('error');
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-2xl px-3 py-3 moon-ask"
    >
      <p className="font-display text-[17px] leading-tight font-semibold text-[#f1dfae]">{MOON_UI.askTitle[l]}</p>
      <p className="mt-1 text-[12px] leading-snug text-mystic-muted">{MOON_UI.askText[l]}</p>
      <AnimatePresence initial={false} mode="wait">
        {!editing ? (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              hapticLight();
              setEditing(true);
            }}
            className="mt-2.5 moon-gold-btn"
          >
            ✦ {MOON_UI.askButton[l]}
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 flex gap-2 items-center"
          >
            <input
              type="date"
              value={value}
              max={today}
              min="1920-01-01"
              onChange={(e) => {
                setValue(e.target.value);
                setStatus('idle');
              }}
              className="flex-1 min-w-0 h-10 rounded-xl bg-black/30 border border-mystic-gold/30 px-3 text-[14px] text-mystic-text [color-scheme:dark] focus:outline-none focus:border-mystic-gold/70"
            />
            <button
              onClick={save}
              disabled={!signKeyFromBirthDate(value) || status === 'saving'}
              className="moon-gold-btn h-10 disabled:opacity-40"
            >
              {status === 'saving' ? '…' : MOON_UI.save[l]}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {status === 'error' && <p className="mt-1.5 text-[11px] text-rose-300/90">{MOON_UI.saveError[l]}</p>}
      {onCancel && (
        <button onClick={onCancel} className="mt-2 text-[11px] text-mystic-muted underline decoration-dotted underline-offset-2">
          {MOON_UI.cancel[l]}
        </button>
      )}
    </motion.div>
  );
}
