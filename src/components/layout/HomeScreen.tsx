'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { SPREADS, SpreadConfig } from '@/data/spreads';
import { getSpreadById } from '@/data/spreads';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import ManaBalance from '@/components/ui/ManaBalance';
import ManaIcon from '@/components/ui/ManaIcon';

type L = 'ru' | 'uk' | 'en';

// ─── Daily esoteric quotes (rotate by day of year) ─────────────────────────

const QUOTES: Record<L, string[]> = {
  ru: [
    'Карты не предсказывают будущее — они раскрывают то, что ты уже знаешь, но боишься признать.',
    'Каждая карта — это зеркало. Не бойся заглянуть в отражение.',
    'Вселенная говорит символами. Умей слушать тишину между словами.',
    'Ты не случайно здесь. Карты ждали именно тебя.',
    'Тайна не в картах — она в тебе. Карты лишь помогают её увидеть.',
    'Интуиция — это голос души. Таро помогает его услышать.',
    'Каждый расклад — это диалог с тем, кто знает тебя лучше всех: с тобой.',
    'Ответы всегда были рядом. Карты просто указывают путь.',
    'Самая сильная магия — решимость видеть правду.',
    'Звёзды не управляют тобой. Они освещают дорогу.',
    'Когда одна дверь закрывается, Таро показывает окно.',
    'Не проси у карт лёгкий путь. Проси мудрости пройти свой.',
    'Мистика начинается там, где заканчивается страх.',
    'Карта, которая пугает — та, что несёт самый важный урок.',
    'Доверься процессу. Вселенная знает расписание лучше тебя.',
    'Твоя энергия — это твой компас. Карты лишь подтверждают направление.',
    'За каждым «совпадением» стоит закономерность, которую ты пока не видишь.',
    'Лунный свет не создаёт тени — он раскрывает то, что скрыто.',
    'Старший аркан в раскладе — это вселенная, которая повышает голос.',
    'Перевёрнутая карта — не проклятие, а приглашение посмотреть глубже.',
    'Магия — это внимание к тому, что другие не замечают.',
    'Каждый день — это чистая страница. Карты помогают написать первую строку.',
    'Слушай не то, что карты говорят, а то, что ты чувствуешь, глядя на них.',
    'Самые точные предсказания рождаются в тишине.',
    'Вселенная не посылает знаки случайно. Она ждёт, пока ты будешь готов.',
    'Таро — это мост между разумом и сердцем.',
    'Настоящая сила расклада — не в картах, а в вопросе.',
    'Если карта пришла дважды — вселенная настаивает.',
    'Ты сильнее любого расклада. Карты это знают.',
    'Звёзды складываются для тех, кто не боится темноты.',
    'Магия начинается с веры в себя.',
  ],
  uk: [
    'Карти не передбачають майбутнє — вони розкривають те, що ти вже знаєш, але боїшся визнати.',
    'Кожна карта — це дзеркало. Не бійся зазирнути у відображення.',
    'Всесвіт говорить символами. Вмій слухати тишу між словами.',
    'Ти тут не випадково. Карти чекали саме на тебе.',
    'Таємниця не в картах — вона в тобі. Карти лише допомагають її побачити.',
    'Інтуїція — це голос душі. Таро допомагає його почути.',
    'Кожний розклад — це діалог з тим, хто знає тебе найкраще: з тобою.',
    'Відповіді завжди були поруч. Карти просто вказують шлях.',
    'Найсильніша магія — рішучість бачити правду.',
    'Зірки не керують тобою. Вони освітлюють дорогу.',
    'Коли одні двері зачиняються, Таро показує вікно.',
    'Не проси у карт легкого шляху. Проси мудрості пройти свій.',
    'Містика починається там, де закінчується страх.',
    'Карта, яка лякає — та, що несе найважливіший урок.',
    'Довірся процесу. Всесвіт знає розклад краще за тебе.',
    'Твоя енергія — це твій компас. Карти лише підтверджують напрямок.',
    'За кожним «збігом» стоїть закономірність, яку ти поки не бачиш.',
    'Місячне світло не створює тіні — воно розкриває те, що приховано.',
    'Старший аркан у розкладі — це всесвіт, який підвищує голос.',
    'Перевернута карта — не прокляття, а запрошення подивитися глибше.',
    'Магія — це увага до того, що інші не помічають.',
    'Кожний день — це чиста сторінка. Карти допомагають написати перший рядок.',
    'Слухай не те, що карти кажуть, а те, що ти відчуваєш, дивлячись на них.',
    'Найточніші передбачення народжуються в тиші.',
    'Всесвіт не посилає знаки випадково. Він чекає, поки ти будеш готовий.',
    'Таро — це міст між розумом і серцем.',
    'Справжня сила розкладу — не в картах, а в питанні.',
    'Якщо карта прийшла двічі — всесвіт наполягає.',
    'Ти сильніший за будь-який розклад. Карти це знають.',
    'Зірки складаються для тих, хто не боїться темряви.',
    'Магія починається з віри в себе.',
  ],
  en: [
    'Cards don\'t predict the future — they reveal what you already know but are afraid to admit.',
    'Every card is a mirror. Don\'t be afraid to look at the reflection.',
    'The universe speaks in symbols. Learn to listen to the silence between words.',
    'You\'re not here by accident. The cards were waiting for you.',
    'The mystery isn\'t in the cards — it\'s in you. Cards just help you see it.',
    'Intuition is the voice of the soul. Tarot helps you hear it.',
    'Every reading is a dialogue with the one who knows you best: yourself.',
    'The answers were always near. Cards simply point the way.',
    'The strongest magic is the courage to see the truth.',
    'Stars don\'t control you. They light the path.',
    'When one door closes, Tarot shows you the window.',
    'Don\'t ask the cards for an easy path. Ask for the wisdom to walk yours.',
    'The mystic begins where fear ends.',
    'The card that scares you carries the most important lesson.',
    'Trust the process. The universe knows the schedule better than you.',
    'Your energy is your compass. Cards only confirm the direction.',
    'Behind every "coincidence" lies a pattern you haven\'t seen yet.',
    'Moonlight doesn\'t create shadows — it reveals what\'s hidden.',
    'A Major Arcana in your spread is the universe raising its voice.',
    'A reversed card isn\'t a curse — it\'s an invitation to look deeper.',
    'Magic is paying attention to what others overlook.',
    'Every day is a blank page. Cards help write the first line.',
    'Listen not to what cards say, but to what you feel looking at them.',
    'The most precise readings are born in silence.',
    'The universe doesn\'t send signs randomly. It waits until you\'re ready.',
    'Tarot is a bridge between mind and heart.',
    'The true power of a reading lies not in the cards, but in the question.',
    'If a card came twice — the universe insists.',
    'You are stronger than any reading. The cards know that.',
    'Stars align for those who aren\'t afraid of the dark.',
    'Magic begins with believing in yourself.',
  ],
};

// ─── Typewriter quote component ─────────────────────────────────────────────
function QuoteTypewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, 130);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <p className="text-sm leading-relaxed text-center"
       style={{
         fontStyle: 'italic',
         fontFamily: "'Segoe Script', 'Bradley Hand', 'Apple Chancery', cursive",
         color: '#8b7355',
         letterSpacing: '0.3px',
       }}>
      {displayed}
      {!done && <span className="inline-block w-[2px] h-[14px] ml-[1px] animate-pulse align-middle" style={{ backgroundColor: '#8b7355' }} />}
    </p>
  );
}

function getDailyQuote(l: L): string {
  const now = new Date();
  const start = new Date(now.getUTCFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const quotes = QUOTES[l];
  return quotes[dayOfYear % quotes.length];
}

// ─── Translations ──────────────────────────────────────────────────────────

const T = {
  greeting: { ru: 'Привет', uk: 'Вітаю', en: 'Hello' },
  days: { ru: 'дней', uk: 'днів', en: 'days' },
  cardOfDay: { ru: 'Карта дня', uk: 'Карта дня', en: 'Card of the Day' },
  cardOfDaySub: { ru: 'Бесплатно • Ежедневное послание от карт', uk: 'Безкоштовно • Щоденне послання від карт', en: 'Free • Your daily message from the cards' },
  cardOfDayDone: { ru: 'Уже получена сегодня', uk: 'Вже отримана сьогодні', en: 'Already drawn today' },
  nextCard: { ru: 'Новая карта через', uk: 'Нова карта через', en: 'Next card in' },
  free: { ru: '✦ Бесплатно', uk: '✦ Безкоштовно', en: '✦ Free' },
  tarotTitle: { ru: '✦ Таро и расклады', uk: '✦ Таро і розклади', en: '✦ Tarot Spreads' },
  tarotSub: { ru: 'Классические расклады на все случаи жизни', uk: 'Класичні розклади на всі випадки', en: 'Classic spreads for every occasion' },
  mysticTitle: { ru: '🔮 Эзотерика', uk: '🔮 Езотерика', en: '🔮 Esoteric' },
  mysticSub: { ru: 'Нумерология, сны, совместимость и другое', uk: 'Нумерологія, сни, сумісність та інше', en: 'Numerology, dreams, compatibility & more' },
  start: { ru: 'Начать расклад', uk: 'Почати розклад', en: 'Start reading' },
  cards: { ru: 'карт', uk: 'карт', en: 'cards' },
};

/** Format time remaining as HH:MM:SS */
function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Swipeable Carousel ────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 300;

function SpreadCarousel({
  spreads,
  l,
  onSelect,
}: {
  spreads: SpreadConfig[];
  l: L;
  onSelect: (s: SpreadConfig) => void;
}) {
  const [page, setPage] = useState(0);
  const total = spreads.length;

  const paginate = useCallback((dir: number) => {
    setPage((p) => Math.max(0, Math.min(total - 1, p + dir)));
  }, [total]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
      paginate(1);
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
      paginate(-1);
    }
  }, [paginate]);

  return (
    <div className="pb-2">
      {/* Carousel track */}
      <div className="overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          animate={{ x: `${-page * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
        >
          {spreads.map((spread) => (
            <div key={spread.id} className="min-w-full" style={{ paddingLeft: 2, paddingRight: 2 }}>
              <div className="rounded-2xl bg-mystic-card/80 border border-mystic-accent/20 overflow-hidden">
                {/* Image area — adapts to image size */}
                <div className="w-full bg-gradient-to-br from-[#0c0618] via-[#110a24] to-[#0c0618] overflow-hidden relative">
                  {spread.image ? (
                    <img
                      src={spread.image}
                      alt=""
                      className="w-full h-auto block"
                    />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <span className="text-6xl opacity-80">{spread.icon}</span>
                    </div>
                  )}
                  {/* Subtle vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-mystic-card/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* isNew badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-mystic-text font-mystic text-[17px] leading-tight">
                      {spread.name[l]}
                    </h3>
                    {spread.isNew && (
                      <span className="flex-shrink-0 bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        new
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-mystic-muted mt-1.5 leading-relaxed">
                    {spread.description[l]}
                  </p>

                  {/* Metadata row */}
                  <div className="flex items-center justify-between mt-3">
                    {spread.cardCount > 0 ? (
                      <span className="text-[11px] text-mystic-accent/70">
                        🃏 {spread.cardCount} {T.cards[l]}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] text-mystic-muted flex items-center gap-1">
                      {spread.manaCost === 0 ? (
                        T.free[l]
                      ) : (
                        <><ManaIcon size="sm" /> {spread.manaCost}</>
                      )}
                    </span>
                  </div>

                  {/* Start button */}
                  <button
                    onClick={() => onSelect(spread)}
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-mystic-purple to-mystic-accent text-mystic-bg font-bold text-sm active:scale-[0.98] transition-transform"
                  >
                    {T.start[l]}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dot pagination */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {spreads.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded-full transition-all duration-300 ${
                i === page
                  ? 'bg-mystic-accent w-5 h-1.5'
                  : 'bg-mystic-muted/30 w-1.5 h-1.5 hover:bg-mystic-muted/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Section Component ────────────────────────────────────────────

function CategorySection({
  categoryId,
  title,
  subtitle,
  iconSrc,
  delay,
  l,
}: {
  categoryId: 'tarot' | 'esoteric';
  title: string;
  subtitle: string;
  iconSrc: string;
  delay: number;
  l: L;
}) {
  const [expanded, setExpanded] = useState(false);
  const { selectSpread } = useAppStore();

  const spreads = useMemo(
    () => SPREADS.filter((s) => s.category === categoryId && s.id !== 'card_of_day'),
    [categoryId]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 rounded-2xl bg-mystic-card/80 border border-mystic-accent/20 text-left hover:border-mystic-accent/40 transition-all mb-3"
      >
        <div className="flex items-center gap-3">
          <div className={`w-[60px] h-[60px] relative flex-shrink-0 ${categoryId === 'tarot' ? 'animate-breathe' : 'animate-gentle-tilt'}`}>
            <Image src={iconSrc} alt="" fill className="object-contain" unoptimized />
          </div>
          <div className="flex-1">
            <p className="font-bold text-mystic-text font-mystic">{title}</p>
            <p className="text-xs text-mystic-muted mt-0.5">{subtitle}</p>
          </div>
          <motion.span
            className="text-mystic-accent text-sm"
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden mb-3"
          >
            <SpreadCarousel spreads={spreads} l={l} onSelect={selectSpread} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main HomeScreen ───────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, locale, setScreen, setCurrentReading, addToHistory } = useAppStore();
  const l = (locale || 'ru') as L;

  const [cotdDrawn, setCotdDrawn] = useState(false);
  const [cotdReading, setCotdReading] = useState<any>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [cotdLoading, setCotdLoading] = useState(false);

  const dailyQuote = useMemo(() => getDailyQuote(l), [l]);

  // Check if card of day already drawn
  useEffect(() => {
    const checkCotd = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg?.initData) return;
      try {
        const res = await fetch(`/api/card-of-day?initData=${encodeURIComponent(tg.initData)}`);
        const data = await res.json();
        if (data.exists) {
          setCotdDrawn(true);
          setCotdReading(data.reading);
        }
        if (data.nextReset) setNextReset(data.nextReset);
      } catch { /* ignore */ }
    };
    checkCotd();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!nextReset) return;
    const timer = setInterval(() => {
      const ms = new Date(nextReset).getTime() - Date.now();
      if (ms <= 0) {
        setCotdDrawn(false);
        setCotdReading(null);
        setTimeLeft('');
        clearInterval(timer);
      } else {
        setTimeLeft(formatTimeLeft(ms));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextReset]);

  const handleCardOfDay = async () => {
    if (cotdDrawn && cotdReading) {
      setCurrentReading({ ...cotdReading, alreadyDrawn: true });
      setScreen('reading');
      return;
    }
    setCotdLoading(true);
    const tg = (window as any).Telegram?.WebApp;
    try {
      const res = await fetch('/api/card-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg?.initData || '' }),
      });
      const data = await res.json();
      if (data.interpretation) {
        const reading = {
          id: data.id,
          spreadId: 'card_of_day',
          cards: data.cards || [],
          interpretation: data.interpretation,
          createdAt: data.createdAt,
          generatedImage: data.generatedImage || undefined,
        };
        setCotdDrawn(true);
        setCotdReading(reading);
        if (data.nextReset) setNextReset(data.nextReset);
        setCurrentReading(reading);
        addToHistory(reading);
        setScreen('reading');
      }
    } catch (err) {
      console.error('Card of day error:', err);
    } finally {
      setCotdLoading(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-4 relative z-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-mystic text-gradient-gold">✨ Магия Карт</h1>
          <ManaBalance onClick={() => setScreen('shop')} />
        </div>
        {user && (
          <p className="text-sm text-mystic-muted mt-1">
            {T.greeting[l]}, {user.firstName}
            {user.streakDays > 0 && (
              <span className="ml-2 text-mystic-accent">🔥 {user.streakDays} {T.days[l]}</span>
            )}
          </p>
        )}
      </motion.div>

      {/* Card of the Day */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={handleCardOfDay}
        disabled={cotdLoading}
        className="w-full mb-4 p-3 rounded-2xl bg-gradient-to-br from-mystic-purple/30 via-mystic-card to-mystic-blue/30 border border-mystic-accent/40 glow-strong text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-[120px] h-[120px] relative flex-shrink-0 animate-float">
            {cotdDrawn && cotdReading?.cards?.[0]?.image ? (
              <Image src={cotdReading.cards[0].image} alt="Card of Day" fill className="object-contain rounded-lg" unoptimized />
            ) : (
              <Image src="/ui/card-of-day.png" alt="Card of Day" fill className="object-contain" unoptimized />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-mystic-accent font-mystic">{T.cardOfDay[l]}</p>
            {cotdDrawn ? (
              <div>
                <p className="text-xs text-green-400 mt-0.5">✅ {T.cardOfDayDone[l]}</p>
                {timeLeft && (
                  <p className="text-[10px] text-mystic-muted mt-0.5">
                    ⏰ {T.nextCard[l]} {timeLeft}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-mystic-muted mt-0.5">{T.cardOfDaySub[l]}</p>
            )}
          </div>
          <div className="relative text-mystic-accent text-2xl">
            {cotdLoading ? (
              <span className="animate-spin">🔮</span>
            ) : (
              <>
                →
                {!cotdDrawn && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                )}
              </>
            )}
          </div>
        </div>
      </motion.button>

      {/* Daily Esoteric Quote — typewriter effect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 px-5 py-4 rounded-2xl bg-gradient-to-br from-mystic-card via-mystic-card to-mystic-purple/10 border border-mystic-accent/10"
      >
        <QuoteTypewriter text={`«${dailyQuote}»`} />
        <p className="text-[10px] text-mystic-muted text-center mt-2 opacity-60">✦ ✦ ✦</p>
      </motion.div>

      {/* Category: Tarot */}
      <CategorySection
        categoryId="tarot"
        title={T.tarotTitle[l]}
        subtitle={T.tarotSub[l]}
        iconSrc="/ui/tarot-header.webp"
        delay={0.3}
        l={l}
      />

      {/* Category: Esoteric */}
      <CategorySection
        categoryId="esoteric"
        title={T.mysticTitle[l]}
        subtitle={T.mysticSub[l]}
        iconSrc="/ui/esoteric-header.webp"
        delay={0.35}
        l={l}
      />
    </div>
  );
}
