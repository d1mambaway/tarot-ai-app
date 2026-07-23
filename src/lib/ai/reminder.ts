/**
 * Personalized follow-up reminders — 3-5 days after a user's last reading,
 * nudge them back with a message grounded in what they actually asked about
 * (via memory), instead of a generic "come back!" push.
 */

import { db } from '@/lib/db';
import { callGrok } from './clients';
import { buildUserMemoryContext } from './memory';

type Locale = 'ru' | 'uk' | 'en';

const REMINDER_MIN_DAYS = 3;
const REMINDER_MAX_DAYS = 5;

// Reminders only apply to readings made after this feature shipped — old
// readings that already sat in the DB for weeks/months should never trigger
// a "haven't seen you in a while" push, since that reading wasn't made with
// this feature in mind and the timing would feel random/stale to the user.
const REMINDER_FEATURE_LAUNCH_AT = new Date('2026-07-23T00:00:00.000Z');

/**
 * Finds users whose latest reading is 3-5 days old, has no reminder sent yet,
 * and who haven't done a newer reading since. Generates one short, personal
 * Telegram message per user grounded in their own last question/interpretation.
 */
export async function collectDueReminders(): Promise<{
  telegramId: bigint;
  locale: Locale;
  readingId: string;
  message: string;
}[]> {
  const now = new Date();
  const minDate = new Date(now.getTime() - REMINDER_MAX_DAYS * 24 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() - REMINDER_MIN_DAYS * 24 * 60 * 60 * 1000);
  // Never let the 3-5-day window reach further back than the feature's launch.
  const effectiveMinDate = minDate > REMINDER_FEATURE_LAUNCH_AT ? minDate : REMINDER_FEATURE_LAUNCH_AT;

  // Candidate readings: 3-5 days old, made after this feature launched, no
  // reminder sent yet.
  const candidates = await db.reading.findMany({
    where: {
      createdAt: { gte: effectiveMinDate, lte: maxDate },
      reminderSentAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  const results: { telegramId: bigint; locale: Locale; readingId: string; message: string }[] = [];
  const seenUsers = new Set<string>();

  for (const reading of candidates) {
    if (seenUsers.has(reading.userId)) continue; // one reminder per user per run
    seenUsers.add(reading.userId);

    // Skip if user has a newer reading than this one (already engaged again)
    const newerReading = await db.reading.findFirst({
      where: { userId: reading.userId, createdAt: { gt: reading.createdAt } },
      select: { id: true },
    });
    if (newerReading) continue;

    const locale = (['ru', 'uk', 'en'].includes(reading.user.locale) ? reading.user.locale : 'ru') as Locale;
    const memoryContext = await buildUserMemoryContext(reading.userId, locale, { take: 1 });
    if (!memoryContext) continue;

    try {
      const message = await buildReminderMessage(memoryContext, locale);
      results.push({ telegramId: reading.user.telegramId, locale, readingId: reading.id, message });
    } catch (e) {
      console.error('Failed to build reminder message for user', reading.userId, e);
    }
  }

  return results;
}

async function buildReminderMessage(memoryContext: string, locale: Locale): Promise<string> {
  const lang = locale === 'uk' ? 'українською мовою' : locale === 'en' ? 'in English' : 'на русском языке';

  const prompt = `Ты — Оракул Магии Карт. Спустя несколько дней после последнего расклада ты сам, по своей инициативе, пишешь человеку короткое личное сообщение — как будто вспомнил о нём и его вопросе.

Вот что ты помнишь об этом человеке:
${memoryContext}

Напиши ОДНО короткое пуш-сообщение (2-3 предложения, не абзацы, до ~350 знаков) СТРОГО ${lang}:
- Начни не с приветствия, а сразу с сути — как будто продолжаешь мысль
- Сошлись на конкретную тему его прошлого вопроса, но не пересказывай её дословно, а покажи, что ты помнишь и она тебя "не отпускала"
- Дай крошечный новый инсайт или наблюдение по этой теме, будто что-то прояснилось за эти дни
- Закончи мягким приглашением вернуться и посмотреть, что изменилось — без давления и без слова "купи"
- Никаких общих фраз вроде "вселенная посылает знаки", никакого упоминания AI/нейросетей
- Не используй markdown, только обычный текст с эмодзи (максимум 1-2)`;

  const raw = await callGrok(
    [
      { role: 'system', content: 'Ты живой мистический оракул, пишущий короткие личные пуш-уведомления.' },
      { role: 'user', content: prompt },
    ],
    300,
  );

  return raw.trim();
}

/** Marks a reading's reminder as sent so it isn't repeated. */
export async function markReminderSent(readingId: string): Promise<void> {
  await db.reading.update({
    where: { id: readingId },
    data: { reminderSentAt: new Date() },
  });
}
