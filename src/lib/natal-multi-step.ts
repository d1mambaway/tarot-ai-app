/**
 * Multi-step natal chart generation pipeline with background queue.
 *
 * The API accepts the request instantly, creates a "pending" reading in DB,
 * and runs generation in the background. When done it updates the reading
 * to "complete" and sends a Telegram notification.
 *
 * Steps:
 *   1. Big Three + Synthesis
 *   2. Personal Planets
 *   3. Aspects + Elements + Karma + Lilith + Retrogrades
 *   4. Career + Relationships + Action Map + Portrait
 *   5. Review / editor pass
 *
 * Each step retries with exponential backoff on rate-limit (429) errors.
 * A 60-second pause between calls respects the 12K tokens/min limit.
 */

import { callGrok } from './grok';
import { db } from './db';
import { sendMessage } from './telegram';
import { calculateNatalChart, formatNatalDataForPrompt } from './natal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PhraseTracker {
  actions: string[];
  risks: string[];
  themes: string[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

/** Pause between Groq calls (ms). 60s per step to stay within 12K tok/min. */
const STEP_DELAY_MS = 60_000;

/** Max retries per step when hitting 429. */
const MAX_STEP_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Core rules (shared across all generation steps) ─────────────────────────

const CORE_RULES = `ТОНАЛЬНОСТЬ И СТИЛЬ:
• Обращение только на «ты». Тон: как друг-астролог, тёплый и честный.
• Никаких «Вы», «Указывает на то, что...», «Ты должен/должна...», «Старайся...».
• Каждый блок: [Описание] → [⚠️ Слепая зона/Риск] → [✨ Действие].
• Действие = КОНКРЕТНОЕ, реализуемое завтра. Не «медитируй», а объясни ЧТО и КАК.
• Если фраза подходит к 3+ планетам — это шаблон, перепиши.

АСТРОЛОГИЧЕСКАЯ ТОЧНОСТЬ:
• Сатурн в Рыбах = сомнения/страхи, НЕ дисциплина.
• Марс ℞ = энергия внутрь, это инструмент, не баг.
• Тригон/Секстиль = ресурс. Квадратура/Оппозиция = вызов.
• Северный Узел = куда расти. Южный Узел = что отпускать.
• Лилит = скрытая сила + тень, без осуждения.
• Всегда связывай планету с домом: в каком доме → в какой сфере жизни.

ЗАПРЕЩЁННЫЕ ФРАЗЫ:
❌ «Ты естественным образом притягиваешься к...»
❌ «Ты способен создать новые решения...»
❌ «Риск здесь в том, что ты можешь...»
❌ «Практикуй самоанализ и устанавливай реалистичные цели»
❌ «слишком сильно сосредоточиться на... и упустить...»
❌ «не потеряться в...»

ЯЗЫК:
• Строго русский (или украинский, если указано). Допустимы только: MC, ASC, IC, DC.
• Без опечаток, смешанной кириллицы/латиницы, потерянных частей слов.`;

// ─── Tracker helpers ─────────────────────────────────────────────────────────

function extractTracker(text: string, prev: PhraseTracker): PhraseTracker {
  const t: PhraseTracker = {
    actions: [...prev.actions],
    risks: [...prev.risks],
    themes: [...prev.themes],
  };
  const lines = text.split('\n');
  let cur: 'action' | 'risk' | null = null;
  let buf = '';
  const flush = () => {
    if (cur && buf.trim()) (cur === 'action' ? t.actions : t.risks).push(buf.trim());
    buf = '';
  };
  for (const raw of lines) {
    const ln = raw.trim();
    if (ln.startsWith('✨') || /^Действие[:\s]/i.test(ln)) {
      flush(); cur = 'action';
      buf = ln.replace(/^✨\s*/, '').replace(/^Действие[:\s]*/i, '');
      continue;
    }
    if (ln.startsWith('⚠️') || /^(Слепая зона|Риск|Ловушка)[:\s]/i.test(ln)) {
      flush(); cur = 'risk';
      buf = ln.replace(/^⚠️\s*/, '').replace(/^(Слепая зона|Риск|Ловушка)[:\s]*/i, '');
      continue;
    }
    if (/^[🌟🪐⚡🔥🌙🌑💫🏠💝🎯✨🔮]/.test(ln)) {
      flush(); cur = null;
      if (ln.length > 3) t.themes.push(ln.slice(0, 80));
      continue;
    }
    if (cur && ln) buf += ' ' + ln;
  }
  flush();
  return t;
}

function antiRep(t: PhraseTracker): string {
  if (!t.actions.length && !t.risks.length) return '';
  let s = '\n🚫 УЖЕ ИСПОЛЬЗОВАНО (НЕ ПОВТОРЯТЬ — придумай ДРУГИЕ):\n';
  if (t.actions.length) {
    s += '\nДействия уже данные:\n';
    for (const a of t.actions) s += `• ${a.slice(0, 120)}\n`;
  }
  if (t.risks.length) {
    s += '\nРиски/слепые зоны уже описанные:\n';
    for (const r of t.risks) s += `• ${r.slice(0, 120)}\n`;
  }
  return s;
}

// ─── Safe callGrok with aggressive retry on 429 ─────────────────────────────

/**
 * Wrapper around callGrok that retries rate-limit errors with exponential
 * backoff. Will wait up to several minutes per step if needed.
 */
async function safeCallGrok(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens: number,
  stepName: string,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_STEP_RETRIES; attempt++) {
    try {
      return await callGrok(messages, maxTokens);
    } catch (err: any) {
      const isRateLimit = err?.name === 'GrokRateLimitError' ||
        err?.message?.includes('429') ||
        err?.message?.includes('rate') ||
        err?.message?.includes('limit');

      if (isRateLimit && attempt < MAX_STEP_RETRIES - 1) {
        // Exponential backoff: 60s, 90s, 120s, 150s
        const wait = (60 + attempt * 30) * 1000;
        console.log(`[natal-multi-step] ${stepName} rate-limited (attempt ${attempt + 1}/${MAX_STEP_RETRIES}), waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      throw err; // Non-rate-limit error or exhausted retries
    }
  }
  throw new Error(`[natal-multi-step] ${stepName} failed after ${MAX_STEP_RETRIES} retries`);
}

// ─── Step system prompts ─────────────────────────────────────────────────────

function sys1(): string {
  return `Ты — талантливый астролог, который пишет глубокие персональные толкования натальных карт.

${CORE_RULES}

ЗАДАЧА: Напиши ТОЛЬКО секцию «🌟 ЯДРО ЛИЧНОСТИ — БОЛЬШАЯ ТРОЙКА»:
• Солнце в [знак] в [доме] — описание (250-350 слов) + ⚠️ слепая зона + ✨ действие
• Луна в [знак] в [доме] — описание (250-350 слов) + ⚠️ слепая зона + ✨ действие
• Асцендент в [знак] — описание (250-350 слов) + ⚠️ слепая зона + ✨ действие
• Синтез — как три элемента взаимодействуют: конфликты, синергии, главная задача (150-200 слов)

ПРИМЕР ПРАВИЛЬНОГО СТИЛЯ:
«Солнце в Рыбах в 12-м доме означает, что твоя жизненная энергия питается духовным поиском и творческой чувствительностью. Ты видишь мир как живую, одухотворённую реальность...

⚠️ Слепая зона: 12-й дом — дом потерь. Твоя чувствительность может растворить границы...

✨ Действие: установи правило — один день в неделю только для себя. Не отвечай на сообщения, не слушай чужие проблемы. Только то, что даёт энергию ТЕБЕ.»

НЕ генерируй ничего кроме Большой Тройки и Синтеза.`;
}

function sys2(t: PhraseTracker): string {
  return `Ты — талантливый астролог, продолжающий толкование натальной карты. Большая тройка уже написана.

${CORE_RULES}

ЗАДАЧА: Напиши ТОЛЬКО секцию «🪐 ЛИЧНЫЕ ПЛАНЕТЫ»:
• Меркурий в [знак] в [доме] — (250-350 слов) + ⚠️ + ✨
• Венера в [знак] в [доме] — (250-350 слов) + ⚠️ + ✨
• Марс в [знак] в [доме] — (250-350 слов) + ⚠️ + ✨
• Юпитер в [знак] в [доме] — (200-250 слов) + ⚠️ + ✨
• Сатурн в [знак] в [доме] — (200-250 слов) + ⚠️ + ✨

Если планета ретроградна — ℞ = энергия внутрь, другой способ действия, НЕ слабость.
КАЖДОЕ действие и риск должны быть УНИКАЛЬНЫМИ.
${antiRep(t)}

НЕ генерируй ничего кроме пяти планет.`;
}

function sys3(t: PhraseTracker): string {
  return `Ты — талантливый астролог, продолжающий толкование. Написаны: Большая тройка, Личные планеты.

${CORE_RULES}

ЗАДАЧА: Напиши ПЯТЬ секций:

1. «⚡ КЛЮЧЕВЫЕ АСПЕКТЫ» — 5-7 самых важных (200-250 слов каждый)
2. «🔥 ЭНЕРГЕТИЧЕСКИЙ БАЛАНС (СТИХИИ)» — сумма = 10 планет
3. «🌙 КАРМИЧЕСКИЙ ВЕКТОР» — Северный/Южный Узел + ✨ действия
4. «🌑 СКРЫТАЯ СИЛА (ЛИЛИТ)» — как ресурс + ⚠️ + ✨
5. «💫 РЕТРОГРАДЫ» (если есть) — каждый: инструмент + ✨
${antiRep(t)}

НЕ генерируй Большую тройку, Планеты, Карьеру или Портрет.`;
}

function sys4(t: PhraseTracker): string {
  return `Ты — талантливый астролог, завершающий толкование натальной карты.

${CORE_RULES}

ЗАДАЧА: Напиши ЧЕТЫРЕ финальные секции:

1. «🏠 ПРИЗВАНИЕ И КАРЬЕРА» (300-400 слов) — на основе MC
2. «💝 ОТНОШЕНИЯ И ПАРТНЁРСТВО» (300-400 слов) — на основе 7-го дома/Венеры
3. «🎯 КАРТА ДЕЙСТВИЙ» — 3 силы + 3 зоны роста + главный совет
4. «✨ ПОРТРЕТ» — интеграция ВСЕЙ карты, НЕ копия Большой тройки
${antiRep(t)}

Каждый совет должен быть ПРИМЕНИМ — человек может сделать это завтра.`;
}

function sysReview(): string {
  return `Ты — профессиональный редактор астрологических текстов.

НАЙДИ И ИСПРАВЬ:
1. ПОВТОРЕНИЯ: если фраза встречается >1 раза — перепиши
2. ШАБЛОНЫ из чёрного списка → замени на уникальные формулировки
3. ОДНОТИПНЫЕ ⚠️/✨ блоки → разнообрази
4. ПУСТЫЕ СОВЕТЫ («медитируй», «развивайся») → конкретика
5. ОПЕЧАТКИ и смешанная кириллица/латиница
6. МАТЕМАТИКА СТИХИЙ: сумма = 10
7. АСТРО-ОШИБКИ: тригоны = ресурсы, квадратуры = вызовы

ВЫВЕДИ ПОЛНЫЙ отредактированный текст без комментариев.`;
}

// ─── Core pipeline (generates the text) ──────────────────────────────────────

async function runPipeline(natalData: string, locale: 'ru' | 'uk' | 'en'): Promise<string> {
  const lang = locale === 'uk' ? 'украинском' : 'русском';
  const langNote = `Пиши строго на ${lang} языке. Допустимы только: MC, ASC, IC, DC.`;
  const data = `АСТРОЛОГИЧЕСКИЕ ДАННЫЕ (рассчитано программно — используй ТОЛЬКО эти данные):\n${natalData}`;

  let tracker: PhraseTracker = { actions: [], risks: [], themes: [] };
  const parts: string[] = [];

  // Step 1
  console.log('[natal-multi-step] Step 1/5 — Big Three');
  const s1 = await safeCallGrok(
    [{ role: 'system', content: sys1() }, { role: 'user', content: `${langNote}\n\n${data}\n\nГенерируй Большую тройку + Синтез.` }],
    2500, 'Step 1',
  );
  tracker = extractTracker(s1, tracker);
  parts.push(s1);
  await sleep(STEP_DELAY_MS);

  // Step 2
  console.log('[natal-multi-step] Step 2/5 — Personal Planets');
  const s2 = await safeCallGrok(
    [{ role: 'system', content: sys2(tracker) }, { role: 'user', content: `${langNote}\n\n${data}\n\nГенерируй Личные планеты.` }],
    3000, 'Step 2',
  );
  tracker = extractTracker(s2, tracker);
  parts.push(s2);
  await sleep(STEP_DELAY_MS);

  // Step 3
  console.log('[natal-multi-step] Step 3/5 — Aspects + Elements + Karma');
  const s3 = await safeCallGrok(
    [{ role: 'system', content: sys3(tracker) }, { role: 'user', content: `${langNote}\n\n${data}\n\nГенерируй Аспекты, Стихии, Карму, Лилит, Ретрограды.` }],
    3000, 'Step 3',
  );
  tracker = extractTracker(s3, tracker);
  parts.push(s3);
  await sleep(STEP_DELAY_MS);

  // Step 4
  console.log('[natal-multi-step] Step 4/5 — Career + Relationships + Portrait');
  const s4 = await safeCallGrok(
    [{ role: 'system', content: sys4(tracker) }, { role: 'user', content: `${langNote}\n\n${data}\n\nГенерируй Карьеру, Отношения, Карту действий, Портрет.` }],
    2500, 'Step 4',
  );
  parts.push(s4);
  await sleep(STEP_DELAY_MS);

  // Step 5 — Review
  console.log('[natal-multi-step] Step 5/5 — Review pass');
  const assembled = `🔮 ТОЛКОВАНИЕ НАТАЛЬНОЙ КАРТЫ\n\n${parts.join('\n\n')}`;
  const final = await safeCallGrok(
    [{ role: 'system', content: sysReview() }, { role: 'user', content: `${langNote}\n\nОТРЕДАКТИРУЙ ЭТУ НАТАЛЬНУЮ КАРТУ:\n\n${assembled}` }],
    8000, 'Step 5 Review',
  );

  console.log('[natal-multi-step] Done — all 5 steps complete');
  return final;
}

// ─── Notification helpers ────────────────────────────────────────────────────

const NOTIFY_TEXT: Record<string, string> = {
  ru: '🔮 Твоя натальная карта готова! Зайди в историю чтений, чтобы увидеть её.',
  uk: '🔮 Твоя натальна карта готова! Зайди в історію читань, щоб побачити її.',
  en: '🔮 Your natal chart is ready! Check your reading history to view it.',
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Start background natal chart generation.
 *
 * 1. Creates a "pending" Reading in the DB
 * 2. Returns immediately with the reading ID
 * 3. Runs 5-step pipeline in the background
 * 4. Updates the reading to "complete" (or "failed") when done
 * 5. Sends a Telegram notification
 *
 * Call this from route.ts instead of the synchronous pipeline.
 */
export function startNatalChartBackground(opts: {
  readingId: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  locale: 'ru' | 'uk' | 'en';
  telegramChatId: number;
}): void {
  // Fire-and-forget — the caller returns the response immediately
  processNatalChart(opts).catch((err) => {
    console.error('[natal-multi-step] Fatal background error:', err);
  });
}

async function processNatalChart(opts: {
  readingId: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  locale: 'ru' | 'uk' | 'en';
  telegramChatId: number;
}): Promise<void> {
  const { readingId, birthDate, birthTime, birthCity, locale, telegramChatId } = opts;

  try {
    // Calculate natal data
    const natalData = await calculateNatalChart({ birthDate, birthTime, birthCity });
    const formattedData = formatNatalDataForPrompt(natalData);

    // Store SVG data immediately
    // (natalChartData is returned in the initial response via the route)

    // Run the multi-step pipeline
    const interpretation = await runPipeline(formattedData, locale);

    // Update reading in DB
    await db.reading.update({
      where: { id: readingId },
      data: {
        interpretation,
        status: 'complete',
      },
    });

    // Send Telegram notification
    try {
      await sendMessage(telegramChatId, NOTIFY_TEXT[locale] || NOTIFY_TEXT.ru);
    } catch (notifyErr) {
      console.error('[natal-multi-step] Failed to send notification:', notifyErr);
      // Non-fatal — the reading is still saved
    }

    console.log(`[natal-multi-step] Reading ${readingId} completed successfully`);
  } catch (err) {
    console.error(`[natal-multi-step] Reading ${readingId} failed:`, err);

    // Mark as failed so the user knows
    try {
      const failMsg = locale === 'uk'
        ? '⚠️ Виникла помилка при генерації натальної карти. Спробуй ще раз.'
        : locale === 'en'
          ? '⚠️ An error occurred while generating your natal chart. Please try again.'
          : '⚠️ Произошла ошибка при генерации натальной карты. Попробуй ещё раз.';

      await db.reading.update({
        where: { id: readingId },
        data: { interpretation: failMsg, status: 'failed' },
      });

      // Notify about the failure too
      try {
        const failNotify = locale === 'uk'
          ? '⚠️ На жаль, натальну карту не вдалося згенерувати. Спробуй ще раз.'
          : locale === 'en'
            ? '⚠️ Sorry, your natal chart could not be generated. Please try again.'
            : '⚠️ К сожалению, натальную карту не удалось сгенерировать. Попробуй ещё раз.';
        await sendMessage(telegramChatId, failNotify);
      } catch { /* ignore notification failure */ }
    } catch (dbErr) {
      console.error('[natal-multi-step] Failed to update failed status:', dbErr);
    }
  }
}

/**
 * Synchronous variant — kept for testing or if you prefer to wait.
 * NOT used by default routes (they use startNatalChartBackground).
 */
export async function generateNatalChartMultiStep(
  natalData: string,
  locale: 'ru' | 'uk' | 'en' = 'ru',
): Promise<string> {
  return runPipeline(natalData, locale);
}
