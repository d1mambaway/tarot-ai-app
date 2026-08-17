'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDestinyMatrix, arcanaName, arcanaImage } from '@/lib/matrix';
import { renderMatrixSVG } from '@/lib/matrix-svg';
import { hapticLight } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

interface Props {
  /** Birth date as "DD.MM.YYYY" — the whole chart is derived from it */
  birthDate: string;
  locale?: L;
}

const T = {
  legend: { ru: 'Что означает каждая точка', uk: 'Що означає кожна точка', en: 'What each point means' },
  tapHint: { ru: 'Нажми на точку, чтобы раскрыть значение', uk: 'Натисни на точку, щоб розкрити значення', en: 'Tap a point to see its meaning' },
  invalid: { ru: 'Не удалось построить матрицу по этой дате', uk: 'Не вдалося побудувати матрицю за цією датою', en: 'Could not build the matrix for this date' },
};

/** Position descriptions shown in the legend under the chart. */
const POSITIONS: { key: string; label: Record<L, string>; hint: Record<L, string> }[] = [
  {
    key: 'E',
    label: { ru: 'Центр — Комета', uk: 'Центр — Комета', en: 'Centre — the Comet' },
    hint: {
      ru: 'Главная энергия, через которую ты проживаешь жизнь',
      uk: 'Головна енергія, через яку ти проживаєш життя',
      en: 'The core energy you live your life through',
    },
  },
  {
    key: 'A',
    label: { ru: 'День — данность', uk: 'День — даність', en: 'Day — your given' },
    hint: {
      ru: 'Зона комфорта и то, что дано тебе от рождения',
      uk: 'Зона комфорту й те, що дано тобі від народження',
      en: 'Your comfort zone and what you were born with',
    },
  },
  {
    key: 'B',
    label: { ru: 'Месяц — что несёшь в мир', uk: 'Місяць — що несеш у світ', en: 'Month — what you bring' },
    hint: {
      ru: 'Качества, которые люди видят в тебе первыми',
      uk: 'Якості, які люди бачать у тобі першими',
      en: 'The qualities people notice in you first',
    },
  },
  {
    key: 'C',
    label: { ru: 'Год — талант и опора', uk: 'Рік — талант і опора', en: 'Year — talent & support' },
    hint: {
      ru: 'Унаследованный ресурс, на который можно опереться',
      uk: 'Успадкований ресурс, на який можна спертися',
      en: 'The inherited resource you can lean on',
    },
  },
  {
    key: 'D',
    label: { ru: 'Предназначение', uk: 'Призначення', en: 'Purpose' },
    hint: {
      ru: 'Задача воплощения — куда ведёт линия судьбы',
      uk: 'Завдання втілення — куди веде лінія долі',
      en: 'The task of this incarnation',
    },
  },
];

export default function DestinyMatrixChart({ birthDate, locale = 'ru' }: Props) {
  const l = locale;
  const [openKey, setOpenKey] = useState<string | null>(null);

  const built = useMemo(() => {
    try {
      const matrix = calculateDestinyMatrix(birthDate);
      return { matrix, svg: renderMatrixSVG(matrix, { locale: l, idPrefix: 'dm' }) };
    } catch {
      return null;
    }
  }, [birthDate, l]);

  if (!built) {
    return <p className="text-xs text-mystic-muted text-center py-4">{T.invalid[l]}</p>;
  }

  const { matrix, svg } = built;

  return (
    <div>
      <div className="w-full" dangerouslySetInnerHTML={{ __html: svg }} />

      <p className="text-[11px] text-mystic-muted text-center mt-1 mb-3">{T.tapHint[l]}</p>

      <div className="space-y-2">
        {POSITIONS.map((pos) => {
          const value = matrix[pos.key as 'A' | 'B' | 'C' | 'D' | 'E'];
          const isOpen = openKey === pos.key;
          return (
            <button
              key={pos.key}
              onClick={() => {
                hapticLight();
                setOpenKey(isOpen ? null : pos.key);
              }}
              className="w-full text-left bg-mystic-card/60 rounded-xl p-3 border border-mystic-accent/15
                         active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={arcanaImage(value)}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover border border-mystic-gold/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-mystic-text">{pos.label[l]}</p>
                  <p className="text-xs text-mystic-accent">
                    {value} · {arcanaName(value, l)}
                  </p>
                </div>
                <span className="text-mystic-muted text-sm shrink-0">{isOpen ? '−' : '+'}</span>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-xs text-mystic-muted mt-2 overflow-hidden"
                  >
                    {pos.hint[l]}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
