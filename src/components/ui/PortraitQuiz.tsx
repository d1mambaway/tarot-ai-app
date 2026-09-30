'use client';

/**
 * «Прочитай меня» questionnaire: eight short questions, one at a time.
 * Most answers are one tap on a chip (it moves on by itself); the rest are a
 * short line of text. The answers go to the reading and are remembered for
 * later ones (lib/profile-facts).
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PortraitAnswers } from '@/lib/profile-facts';
import { hapticLight } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';
type L3 = Record<L, string>;

interface Step {
  key: keyof PortraitAnswers;
  q: L3;
  hint?: L3;
  chips?: L3[];
  placeholder?: L3;
  optional?: boolean;
}

const STEPS: Step[] = [
  {
    key: 'name',
    q: { ru: 'Как к тебе обращаться?', uk: 'Як до тебе звертатися?', en: 'What should I call you?' },
    placeholder: { ru: 'Имя', uk: 'Ім’я', en: 'Name' },
  },
  {
    key: 'age',
    q: { ru: 'Сколько тебе лет?', uk: 'Скільки тобі років?', en: 'How old are you?' },
    chips: [
      { ru: 'до 18', uk: 'до 18', en: 'under 18' },
      { ru: '18–24', uk: '18–24', en: '18–24' },
      { ru: '25–30', uk: '25–30', en: '25–30' },
      { ru: '31–40', uk: '31–40', en: '31–40' },
      { ru: '41–50', uk: '41–50', en: '41–50' },
      { ru: '50+', uk: '50+', en: '50+' },
    ],
  },
  {
    key: 'occupation',
    q: { ru: 'Чем ты занимаешься?', uk: 'Чим ти займаєшся?', en: 'What do you do?' },
    placeholder: { ru: 'Учусь на дизайнера, работаю в IT, в декрете…', uk: 'Навчаюся на дизайнера, працюю в IT, у декреті…', en: 'Studying design, working in IT, on parental leave…' },
  },
  {
    key: 'relationship',
    q: { ru: 'Что у тебя с отношениями?', uk: 'Що в тебе зі стосунками?', en: 'How is your love life?' },
    chips: [
      { ru: 'Свободен(а)', uk: 'Вільний(а)', en: 'Single' },
      { ru: 'Влюблён(а) без взаимности', uk: 'Закоханий(а) без взаємності', en: 'In love, not mutual' },
      { ru: 'В отношениях', uk: 'У стосунках', en: 'In a relationship' },
      { ru: 'В браке', uk: 'У шлюбі', en: 'Married' },
      { ru: 'Всё сложно', uk: 'Усе складно', en: 'It’s complicated' },
      { ru: 'Недавно расстались', uk: 'Нещодавно розійшлися', en: 'Recently broke up' },
    ],
  },
  {
    key: 'focus',
    q: { ru: 'Что сейчас волнует больше всего?', uk: 'Що зараз хвилює найбільше?', en: 'What matters most right now?' },
    chips: [
      { ru: 'Любовь', uk: 'Кохання', en: 'Love' },
      { ru: 'Работа и деньги', uk: 'Робота і гроші', en: 'Work and money' },
      { ru: 'Семья', uk: 'Сім’я', en: 'Family' },
      { ru: 'Найти себя', uk: 'Знайти себе', en: 'Finding myself' },
      { ru: 'Здоровье и силы', uk: 'Здоров’я і сили', en: 'Health and energy' },
      { ru: 'Перемены и переезд', uk: 'Зміни і переїзд', en: 'Change and moving' },
    ],
  },
  {
    key: 'fear',
    q: { ru: 'Чего ты боишься больше всего?', uk: 'Чого ти боїшся найбільше?', en: 'What do you fear most?' },
    chips: [
      { ru: 'Остаться одному', uk: 'Залишитися самому', en: 'Being alone' },
      { ru: 'Не реализоваться', uk: 'Не реалізуватися', en: 'Not fulfilling myself' },
      { ru: 'Ошибиться с выбором', uk: 'Помилитися з вибором', en: 'Making the wrong choice' },
      { ru: 'Потерять близких', uk: 'Втратити близьких', en: 'Losing loved ones' },
      { ru: 'Остаться без денег', uk: 'Залишитися без грошей', en: 'Running out of money' },
      { ru: 'Что меня не поймут', uk: 'Що мене не зрозуміють', en: 'Being misunderstood' },
    ],
  },
  {
    key: 'words',
    q: { ru: 'Опиши себя тремя словами', uk: 'Опиши себе трьома словами', en: 'Describe yourself in three words' },
    placeholder: { ru: 'Например: упрямая, добрая, мечтательная', uk: 'Наприклад: вперта, добра, мрійлива', en: 'e.g. stubborn, kind, dreamy' },
  },
  {
    key: 'wish',
    q: { ru: 'Что бы ты изменил(а) в жизни одним взмахом руки?', uk: 'Що б ти змінив(ла) у житті одним помахом руки?', en: 'What would you change in your life with a wave of a hand?' },
    placeholder: { ru: 'Честно, как есть', uk: 'Чесно, як є', en: 'Honestly, as it is' },
    optional: true,
  },
];

const T = {
  next: { ru: 'Дальше', uk: 'Далі', en: 'Next' },
  back: { ru: '← Назад', uk: '← Назад', en: '← Back' },
  skip: { ru: 'Пропустить', uk: 'Пропустити', en: 'Skip' },
  done: { ru: 'Оракул готов тебя прочитать', uk: 'Оракул готовий тебе прочитати', en: 'The Oracle is ready to read you' },
  edit: { ru: 'Изменить ответы', uk: 'Змінити відповіді', en: 'Edit answers' },
  intro: {
    ru: 'Ответь коротко и честно — чем точнее ответы, тем точнее прочтение. Оракул запомнит тебя и в следующих раскладах.',
    uk: 'Відповідай коротко і чесно — що точніші відповіді, то точніше прочитання. Оракул запам’ятає тебе і в наступних розкладах.',
    en: 'Answer briefly and honestly — the truer the answers, the truer the reading. The Oracle will remember you in later readings too.',
  },
};

export const PORTRAIT_STEP_COUNT = STEPS.length;

/** Required answers are in: the reading can start */
export function portraitComplete(v: PortraitAnswers): boolean {
  return STEPS.every((s) => s.optional || (v[s.key] || '').trim().length > 0);
}

export default function PortraitQuiz({
  value,
  onChange,
  locale: l,
}: {
  value: PortraitAnswers;
  onChange: (v: PortraitAnswers) => void;
  locale: L;
}) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState(value[STEPS[0].key] || '');
  const finished = step >= STEPS.length;

  const go = (next: number) => {
    setStep(next);
    if (next < STEPS.length) setText(value[STEPS[next].key] || '');
  };
  const answer = (v: string) => {
    hapticLight();
    onChange({ ...value, [STEPS[step].key]: v });
    go(step + 1);
  };

  if (finished) {
    return (
      <div className="brand-card p-4 text-center">
        <p className="t-section">{T.done[l]}</p>
        <button onClick={() => go(0)} className="mt-2 text-sm text-mystic-muted underline underline-offset-4">{T.edit[l]}</button>
      </div>
    );
  }

  const s = STEPS[step];
  return (
    <div>
      {step === 0 && <p className="text-sm text-mystic-muted mb-3 leading-snug">{T.intro[l]}</p>}

      <div className="flex items-center gap-1.5 mb-3" aria-hidden>
        {STEPS.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-mystic-gold/70' : 'bg-mystic-accent/15'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <p className="t-section mb-3">{s.q[l]}</p>

          {s.chips ? (
            <div className="flex flex-wrap gap-2">
              {s.chips.map((c) => {
                const active = value[s.key] === c[l];
                return (
                  <button
                    key={c.en}
                    onClick={() => answer(c[l])}
                    className={`px-3.5 py-2 rounded-full border text-sm transition ${
                      active
                        ? 'bg-mystic-gold/15 border-mystic-gold/60 text-gold-soft'
                        : 'bg-mystic-card border-mystic-accent/20 text-mystic-text/90'
                    }`}
                  >
                    {c[l]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) answer(text.trim()); }}
                placeholder={s.placeholder?.[l]}
                maxLength={s.key === 'wish' ? 300 : 120}
                className="flex-1 min-w-0 bg-mystic-card border border-mystic-accent/20 rounded-xl p-3 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-accent/50 focus:outline-none transition"
              />
              <button
                onClick={() => (text.trim() ? answer(text.trim()) : s.optional ? answer('') : undefined)}
                disabled={!text.trim() && !s.optional}
                className="shrink-0 px-4 rounded-xl btn-secondary text-sm disabled:opacity-40"
              >
                {text.trim() || !s.optional ? T.next[l] : T.skip[l]}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <button onClick={() => go(step - 1)} className="mt-3 text-sm text-mystic-muted">{T.back[l]}</button>
      )}
    </div>
  );
}
