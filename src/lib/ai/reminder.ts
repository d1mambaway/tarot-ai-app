/**
 * Personalized follow-up reminders — exactly 3 days after a user's last
 * (substantive) reading, nudge them back with a message grounded in what
 * they actually asked about (via memory), instead of a generic "come back!"
 * push.
 */

import { db } from '@/lib/db';
import { callGrok } from './clients';
import { buildUserMemoryContext } from './memory';

type Locale = 'ru' | 'uk' | 'en';

const REMINDER_DAYS = 3;
// The cron that drives this only ticks once a day, so "exactly 3 days" can't
// be more precise than a ~24h band around the 3-day mark. The band is sized
// to match the cron's own cadence: as long as it fires roughly once a day,
// each reading falls into exactly one run's window — no gaps, no duplicates.
const REMINDER_WINDOW_HOURS = 24;

// Reminders only apply to readings made after this feature shipped — old
// readings that already sat in the DB for weeks/months should never trigger
// a "haven't seen you in a while" push, since that reading wasn't made with
// this feature in mind and the timing would feel random/stale to the user.
const REMINDER_FEATURE_LAUNCH_AT = new Date('2026-07-23T00:00:00.000Z');

/**
 * Finds users whose latest reading turned 3 days old today, has no reminder
 * sent yet, and who haven't done a newer (substantive) reading since.
 * Generates one short, personal Telegram message per user grounded in their
 * own last question/interpretation.
 */
export async function collectDueReminders(): Promise<{
  telegramId: bigint;
  locale: Locale;
  readingId: string;
  message: string;
}[]> {
  const now = new Date();
  const halfWindowMs = (REMINDER_WINDOW_HOURS / 2) * 60 * 60 * 1000;
  const centerMs = now.getTime() - REMINDER_DAYS * 24 * 60 * 60 * 1000;
  const minDate = new Date(centerMs - halfWindowMs);
  const maxDate = new Date(centerMs + halfWindowMs);
  // Never let the window reach further back than the feature's launch.
  const effectiveMinDate = minDate > REMINDER_FEATURE_LAUNCH_AT ? minDate : REMINDER_FEATURE_LAUNCH_AT;

  // Candidate readings: ~3 days old, made after this feature launched, no
  // reminder sent yet. CARD_OF_DAY is excluded — it's a free one-tap draw,
  // not a topic worth "circling back to", so it's not worth a personal nudge.
  const candidates = await db.reading.findMany({
    where: {
      createdAt: { gte: effectiveMinDate, lte: maxDate },
      reminderSentAt: null,
      type: { not: 'CARD_OF_DAY' },
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  const results: { telegramId: bigint; locale: Locale; readingId: string; message: string }[] = [];
  const seenUsers = new Set<string>();

  for (const reading of candidates) {
    if (seenUsers.has(reading.userId)) continue; // one reminder per user per run
    seenUsers.add(reading.userId);

    // Skip if the user has a newer *substantive* reading than this one — they
    // already came back and re-engaged with the topic worth reminding about.
    // CARD_OF_DAY doesn't count: it's a free daily tap almost every active
    // user does regardless, so counting it here meant nobody who still opens
    // the app for their daily card (i.e. most retained users) could ever
    // receive this reminder — only users who had gone fully silent could,
    // which defeated the point of a "come back" nudge.
    const newerReading = await db.reading.findFirst({
      where: {
        userId: reading.userId,
        createdAt: { gt: reading.createdAt },
        type: { not: 'CARD_OF_DAY' },
      },
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
