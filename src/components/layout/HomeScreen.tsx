'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { motion } from 'framer-motion';
import ManaBalance from '@/components/ui/ManaBalance';
import CardOfDaySection from '@/components/ui/CardOfDaySection';
import MoonPhaseWidget from '@/components/ui/MoonPhaseWidget';
import SupportModal from '@/components/ui/SupportModal';

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
  // Shift by -6 hours so the quote changes at 6:00 UTC
  const shifted = new Date(now.getTime() - 6 * 3600000);
  const start = new Date(shifted.getUTCFullYear(), 0, 0);
  const diff = shifted.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const quotes = QUOTES[l];
  return quotes[dayOfYear % quotes.length];
}

// ─── Translations ──────────────────────────────────────────────────────────

const T = {
  greeting: { ru: 'Привет', uk: 'Вітаю', en: 'Hello' },
  days: { ru: 'дней', uk: 'днів', en: 'days' },
};

// ─── Main HomeScreen ───────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, locale, setScreen } = useAppStore();
  const l = (locale || 'ru') as L;
  const dailyQuote = useMemo(() => getDailyQuote(l), [l]);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="px-4 pt-2 pb-4 relative z-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
        <div className="flex items-center justify-between">
          {user && (
            <p className="text-sm text-mystic-muted">
              {T.greeting[l]}, {user.firstName}
              {user.streakDays > 0 && (
                <span className="ml-2 text-mystic-accent">🔥 {user.streakDays} {T.days[l]}</span>
              )}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSupport(true)}
              className="w-9 h-9 rounded-xl bg-mystic-card/80 border border-mystic-accent/20 flex items-center justify-center text-lg hover:border-mystic-accent/40 transition-colors aura-mystic"
              aria-label="Support"
            >
              💬
            </button>
            {!user?.isPremium && (
              <button
                onClick={() => setScreen('shop')}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-mystic-gold/20 to-mystic-accent/20 border border-mystic-gold/30 flex items-center justify-center text-lg hover:border-mystic-gold/50 transition-colors animate-pulse-glow"
                aria-label="Get Premium"
              >
                👑
              </button>
            )}
            <ManaBalance onClick={() => setScreen('shop')} />
          </div>
        </div>
      </motion.div>

      {/* Moon Phase */}
      <MoonPhaseWidget locale={l} />

      {/* Card of the Day — shared component */}
      <CardOfDaySection />

      {/* Daily Esoteric Quote — typewriter effect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4 px-5 py-4 rounded-2xl bg-gradient-to-br from-mystic-card via-mystic-card to-mystic-purple/10 border border-mystic-purple/15 aura-purple"
      >
        <QuoteTypewriter text={`«${dailyQuote}»`} />
        <p className="text-[10px] text-mystic-muted text-center mt-2 opacity-60">✦ ✦ ✦</p>
      </motion.div>
      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
