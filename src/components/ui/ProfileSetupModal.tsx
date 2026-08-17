'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Расклад под тебя', uk: 'Розклад під тебе', en: 'Make readings yours' },
  subtitle: {
    ru: 'Укажи имя и пол — и Оракул будет обращаться к тебе правильно, а толкования станут личными.',
    uk: 'Вкажи ім\u2019я та стать — і Оракул звертатиметься до тебе правильно, а тлумачення стануть особистими.',
    en: 'Tell the Oracle your name and gender — readings will speak to you directly.',
  },
  nameLabel: { ru: 'Как к тебе обращаться', uk: 'Як до тебе звертатися', en: 'What should we call you' },
  namePlaceholder: { ru: 'Имя', uk: "Ім'я", en: 'Name' },
  genderLabel: { ru: 'Пол', uk: 'Стать', en: 'Gender' },
  female: { ru: 'Женский', uk: 'Жіноча', en: 'Female' },
  male: { ru: 'Мужской', uk: 'Чоловіча', en: 'Male' },
  neutral: { ru: 'Не указывать', uk: 'Не вказувати', en: 'Prefer not to say' },
  save: { ru: 'Сохранить', uk: 'Зберегти', en: 'Save' },
  saving: { ru: 'Сохраняем...', uk: 'Зберігаємо...', en: 'Saving...' },
  error: {
    ru: 'Не удалось сохранить. Попробуй ещё раз.',
    uk: 'Не вдалося зберегти. Спробуй ще раз.',
    en: "Couldn't save. Please try again.",
  },
  later: { ru: 'Позже', uk: 'Пізніше', en: 'Later' },
};

const GENDERS: { value: 'female' | 'male' | 'neutral'; icon: string }[] = [
  { value: 'female', icon: '♀' },
  { value: 'male', icon: '♂' },
  { value: 'neutral', icon: '✦' },
];

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSetupModal({ open, onClose }: ProfileSetupModalProps) {
  const { user, locale, setProfile } = useAppStore();
  const l = (locale || 'ru') as L;

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'neutral' | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  useEffect(() => {
    if (open) {
      setName(user?.displayName || user?.firstName || '');
      setGender((user?.gender as 'female' | 'male' | 'neutral' | null) || null);
      setStatus('idle');
    }
  }, [open, user?.displayName, user?.firstName, user?.gender]);

  const handleSave = async () => {
    if (!gender || status === 'saving') return;
    hapticLight();
    setStatus('saving');

    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || '';

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, gender, displayName: name.trim() }),
      });

      if (!res.ok) throw new Error('save failed');
      const data = await res.json();

      setProfile({ gender: data.gender || gender, displayName: data.displayName ?? name.trim() });
      hapticSuccess();
      onClose();
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-md mb-4 rounded-3xl bg-mystic-card border border-mystic-accent/25 p-5 aura-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold font-mystic text-gradient-gold mb-1">✨ {T.title[l]}</h2>
            <p className="text-xs text-mystic-muted leading-relaxed mb-4">{T.subtitle[l]}</p>

            <label className="block text-[11px] text-mystic-muted mb-1.5">{T.nameLabel[l]}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              placeholder={T.namePlaceholder[l]}
              className="w-full mb-4 rounded-xl bg-mystic-bg/60 border border-mystic-accent/20 px-3.5 py-2.5 text-sm text-white placeholder:text-mystic-muted/60 focus:outline-none focus:border-mystic-accent/50"
            />

            <label className="block text-[11px] text-mystic-muted mb-1.5">{T.genderLabel[l]}</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => {
                    hapticLight();
                    setGender(g.value);
                  }}
                  className={`rounded-xl py-2.5 px-1 text-xs font-medium transition-colors border ${
                    gender === g.value
                      ? 'bg-gradient-to-br from-mystic-gold/25 to-mystic-accent/20 border-mystic-gold/50 text-white'
                      : 'bg-mystic-bg/50 border-mystic-accent/15 text-mystic-muted hover:border-mystic-accent/35'
                  }`}
                >
                  <span className="block text-base leading-none mb-1">{g.icon}</span>
                  {T[g.value][l]}
                </button>
              ))}
            </div>

            {status === 'error' && <p className="text-xs text-red-400 mb-3">{T.error[l]}</p>}

            <button
              onClick={handleSave}
              disabled={!gender || status === 'saving'}
              className="w-full rounded-xl py-3 text-sm font-bold text-mystic-bg bg-gradient-to-r from-mystic-gold to-mystic-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'saving' ? T.saving[l] : T.save[l]}
            </button>
            <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-mystic-muted">
              {T.later[l]}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
