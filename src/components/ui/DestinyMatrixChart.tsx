'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDestinyMatrix, arcanaName, arcanaImage, type DestinyMatrix } from '@/lib/matrix';
import { renderMatrixSVG } from '@/lib/matrix-svg';
import { sectionIconSrc } from '@/lib/section-icons';
import { hapticLight } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';
type Tr = Record<L, string>;

interface Props {
  /** Birth date as "DD.MM.YYYY" — the whole chart is derived from it */
  birthDate: string;
  locale?: L;
}

const T = {
  tapHint: {
    ru: 'Все точки матрицы — по группам. Нажми на точку, чтобы раскрыть значение',
    uk: 'Усі точки матриці — за групами. Натисни на точку, щоб розкрити значення',
    en: 'Every point of the matrix, by group. Tap a point to see its meaning',
  },
  invalid: { ru: 'Не удалось построить матрицу по этой дате', uk: 'Не вдалося побудувати матрицю за цією датою', en: 'Could not build the matrix for this date' },
};

type Key = Exclude<keyof DestinyMatrix, 'input'>;

interface Point {
  key: Key;
  label: Tr;
  hint: Tr;
}

interface Group {
  id: string;
  icon: string;
  title: Tr;
  points: Point[];
}

/**
 * Legend under the chart: the same points the AI interprets
 * (formatMatrixForPrompt), so the picture carries everything the text talks about.
 */
const GROUPS: Group[] = [
  {
    id: 'core',
    icon: 'persona',
    title: { ru: 'Личность', uk: 'Особистість', en: 'Personality' },
    points: [
      {
        key: 'E',
        label: { ru: 'Центр — Комета', uk: 'Центр — Комета', en: 'Centre — the Comet' },
        hint: { ru: 'Главная энергия, через которую ты проживаешь жизнь', uk: 'Головна енергія, через яку ти проживаєш життя', en: 'The core energy you live your life through' },
      },
      {
        key: 'A',
        label: { ru: 'День — данность', uk: 'День — даність', en: 'Day — your given' },
        hint: { ru: 'Зона комфорта и то, что дано тебе от рождения', uk: 'Зона комфорту й те, що дано тобі від народження', en: 'Your comfort zone and what you were born with' },
      },
      {
        key: 'B',
        label: { ru: 'Месяц — что несёшь в мир', uk: 'Місяць — що несеш у світ', en: 'Month — what you bring' },
        hint: { ru: 'Качества, которые люди видят в тебе первыми', uk: 'Якості, які люди бачать у тобі першими', en: 'The qualities people notice in you first' },
      },
      {
        key: 'C',
        label: { ru: 'Год — талант и опора', uk: 'Рік — талант і опора', en: 'Year — talent & support' },
        hint: { ru: 'Унаследованный ресурс, на который можно опереться', uk: 'Успадкований ресурс, на який можна спертися', en: 'The inherited resource you can lean on' },
      },
      {
        key: 'D',
        label: { ru: 'Предназначение', uk: 'Призначення', en: 'Purpose' },
        hint: { ru: 'Задача воплощения — куда ведёт линия судьбы', uk: 'Завдання втілення — куди веде лінія долі', en: 'The task of this incarnation' },
      },
    ],
  },
  {
    id: 'ancestry',
    icon: 'ancestry',
    title: { ru: 'Род', uk: 'Рід', en: 'Ancestry' },
    points: [
      {
        key: 'F',
        label: { ru: 'Талант рода отца', uk: 'Талант роду батька', en: "Father's line talent" },
        hint: { ru: 'Сила, которую ты получил по мужской линии', uk: 'Сила, яку ти отримав по чоловічій лінії', en: 'The strength passed down the male line' },
      },
      {
        key: 'G',
        label: { ru: 'Талант рода матери', uk: 'Талант роду матері', en: "Mother's line talent" },
        hint: { ru: 'Сила, которую ты получил по женской линии', uk: 'Сила, яку ти отримав по жіночій лінії', en: 'The strength passed down the female line' },
      },
      {
        key: 'maleLine',
        label: { ru: 'Мужская линия рода', uk: 'Чоловіча лінія роду', en: 'Male ancestral line' },
        hint: { ru: 'Общая задача и сценарий по линии отца', uk: 'Спільне завдання й сценарій по лінії батька', en: "The shared task and pattern of the father's line" },
      },
      {
        key: 'femaleLine',
        label: { ru: 'Женская линия рода', uk: 'Жіноча лінія роду', en: 'Female ancestral line' },
        hint: { ru: 'Общая задача и сценарий по линии матери', uk: 'Спільне завдання й сценарій по лінії матері', en: "The shared task and pattern of the mother's line" },
      },
    ],
  },
  {
    id: 'purpose',
    icon: 'outcome',
    title: { ru: 'Предназначение', uk: 'Призначення', en: 'Purpose' },
    points: [
      {
        key: 'personalPurpose',
        label: { ru: 'Личностное', uk: 'Особистісне', en: 'Personal' },
        hint: { ru: 'Чему научиться для себя, примерно до 40 лет', uk: 'Чого навчитися для себе, приблизно до 40 років', en: 'What to learn for yourself, roughly until 40' },
      },
      {
        key: 'socialPurpose',
        label: { ru: 'Социальное', uk: 'Соціальне', en: 'Social' },
        hint: { ru: 'Твоя роль среди людей, в семье и обществе', uk: 'Твоя роль серед людей, у родині й суспільстві', en: 'Your role among people, in family and society' },
      },
      {
        key: 'spiritualPurpose',
        label: { ru: 'Духовное', uk: 'Духовне', en: 'Spiritual' },
        hint: { ru: 'Высшая задача, которая соединяет личное и социальное', uk: 'Вище завдання, що поєднує особисте й соціальне', en: 'The higher task joining the personal and the social' },
      },
    ],
  },
  {
    id: 'money',
    icon: 'money',
    title: { ru: 'Деньги', uk: 'Гроші', en: 'Money' },
    points: [
      {
        key: 'moneyTalent',
        label: { ru: 'Талант, приносящий деньги', uk: 'Талант, що приносить гроші', en: 'The talent that earns' },
        hint: { ru: 'Через какое умение к тебе приходит доход', uk: 'Через яке вміння до тебе приходить дохід', en: 'The skill your income comes through' },
      },
      {
        key: 'moneyKarmicTail',
        label: { ru: 'Что блокирует доход', uk: 'Що блокує дохід', en: 'What blocks income' },
        hint: { ru: 'Кармический хвост: старый сценарий, который мешает деньгам', uk: 'Кармічний хвіст: старий сценарій, що заважає грошам', en: 'The karmic tail: an old pattern in the way of money' },
      },
      {
        key: 'moneyPoint',
        label: { ru: 'Точка денег', uk: 'Точка грошей', en: 'Money point' },
        hint: { ru: 'Через что приходит изобилие', uk: 'Через що приходить достаток', en: 'What abundance comes through' },
      },
    ],
  },
  {
    id: 'love',
    icon: 'love',
    title: { ru: 'Отношения', uk: 'Стосунки', en: 'Relationships' },
    points: [
      {
        key: 'loveTalent',
        label: { ru: 'Талант в отношениях', uk: 'Талант у стосунках', en: 'Talent in love' },
        hint: { ru: 'Что ты даёшь партнёру лучше других', uk: 'Що ти даєш партнерові краще за інших', en: 'What you give a partner better than most' },
      },
      {
        key: 'loveKarmicTail',
        label: { ru: 'Что мешает в отношениях', uk: 'Що заважає у стосунках', en: 'What gets in the way' },
        hint: { ru: 'Кармический узел: повторяющийся сценарий в паре', uk: 'Кармічний вузол: сценарій, що повторюється в парі', en: 'The karmic knot: the pattern that repeats in couples' },
      },
      {
        key: 'lovePoint',
        label: { ru: 'Точка любви', uk: 'Точка кохання', en: 'Love point' },
        hint: { ru: 'Как к тебе приходит партнёрство', uk: 'Як до тебе приходить партнерство', en: 'How partnership comes to you' },
      },
    ],
  },
];

export default function DestinyMatrixChart({ birthDate, locale = 'ru' }: Props) {
  const l = locale;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['core']));
  const [openPoint, setOpenPoint] = useState<string | null>(null);

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

  const toggleGroup = (id: string) => {
    hapticLight();
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="w-full" dangerouslySetInnerHTML={{ __html: svg }} />

      <p className="text-[11px] text-mystic-muted text-center mt-1 mb-3">{T.tapHint[l]}</p>

      <div className="space-y-2">
        {GROUPS.map((group) => {
          const isOpen = openGroups.has(group.id);
          return (
            <div key={group.id} className="bg-mystic-card/60 rounded-xl border border-mystic-accent/15 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sectionIconSrc(group.icon)} alt="" aria-hidden width={22} height={22} className="shrink-0" />
                <span className="flex-1 text-sm font-bold text-mystic-text">{group.title[l]}</span>
                <span className="text-xs text-mystic-accent tabular-nums">
                  {group.points.map((p) => matrix[p.key]).join(' · ')}
                </span>
                <span className={`reading-chevron${isOpen ? ' is-open' : ''}`} aria-hidden>⌄</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-mystic-accent/10 border-t border-mystic-accent/10">
                      {group.points.map((pos) => {
                        const value = matrix[pos.key];
                        const id = `${group.id}-${pos.key}`;
                        const pointOpen = openPoint === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              hapticLight();
                              setOpenPoint(pointOpen ? null : id);
                            }}
                            className="w-full text-left px-3 py-2.5 active:bg-mystic-accent/5"
                          >
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={arcanaImage(value)}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-mystic-gold/40 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-mystic-text">{pos.label[l]}</p>
                                <p className="text-xs text-mystic-accent">
                                  {value} · {arcanaName(value, l)}
                                </p>
                              </div>
                              <span className="text-mystic-muted text-sm shrink-0">{pointOpen ? '−' : '+'}</span>
                            </div>
                            {pointOpen && <p className="text-xs text-mystic-muted mt-2 pl-11">{pos.hint[l]}</p>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
