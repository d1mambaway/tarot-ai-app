/**
 * Multi-step natal chart generation pipeline — Vercel-compatible.
 *
 * Each step runs as a SEPARATE serverless invocation via /api/natal/process.
 * After completing a step, the endpoint chains to itself for the next one.
 * This avoids Vercel's function timeout (max 60s on Hobby).
 *
 * Steps:
 *   1. Big Three + Synthesis
 *   2. Personal Planets
 *   3. Aspects + Elements + Karma + Lilith + Retrogrades
 *   4. Career + Relationships + Action Map + Portrait
 *   5. Review / editor pass → final save + Telegram notification
 *
 * Partial results are stored in `Reading.natalPartialData` (JSON) between steps.
 */

import { callGrok, buildImagePrompt, generateImage } from './grok';
import { db } from './db';
import { sendMessage } from './telegram';
import { calculateNatalChart, formatNatalDataForPrompt } from './natal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PhraseTracker {
  actions: string[];
  risks: string[];
  themes: string[];
}

interface PartialData {
  natalFormattedData: string;
  locale: string;
  telegramChatId: number;
  parts: string[];        // text output from each step
  tracker: PhraseTracker; // anti-repetition tracker
}

// ─── Config ──────────────────────────────────────────────────────────────────

// No retries at step level — callGrok already retries internally.
// If it fails, the polling recovery will re-trigger the step after 90s.

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

async function safeCallGrok(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens: number,
  stepName: string,
): Promise<string> {
  // Single attempt — callGrok already has internal retry for 429.
  // If this fails, processNatalStep catches it and polling recovery retries later.
  console.log(`[natal] ${stepName}: calling Groq (maxTokens=${maxTokens})...`);
  const start = Date.now();
  const result = await callGrok(messages, maxTokens);
  console.log(`[natal] ${stepName}: done in ${Math.round((Date.now() - start) / 1000)}s`);
  return result;
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

// ─── Notification helpers ────────────────────────────────────────────────────

const NOTIFY_TEXT: Record<string, string> = {
  ru: '🔮 Твоя натальная карта готова! Зайди в историю чтений, чтобы увидеть её.',
  uk: '🔮 Твоя натальна карта готова! Зайди в історію читань, щоб побачити її.',
  en: '🔮 Your natal chart is ready! Check your reading history to view it.',
};

// ─── Chain helper: call next step via HTTP ───────────────────────────────────

async function chainNextStep(readingId: string, nextStep: number): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;
  const secret = process.env.CRON_SECRET || '';

  const url = `${baseUrl}/api/natal/process`;
  console.log(`[natal] Chaining to step ${nextStep} for reading ${readingId} via ${url}`);

  // We MUST await the fetch so Vercel doesn't kill the process before the request is sent.
  // Use AbortController with 5s timeout — we just need the request to reach Vercel's router,
  // not wait for the entire step to complete (which could take 60s).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ readingId, step: nextStep }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    console.log(`[natal] Chain response for step ${nextStep}: ${res.status}`);
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      // Expected — request was sent, we just stopped waiting for the response
      console.log(`[natal] Chain request for step ${nextStep} sent (aborted wait — expected)`);
    } else {
      console.error(`[natal] Chain fetch error (step ${nextStep}):`, err);
    }
  }
}

// ─── Public: start the pipeline (called from route.ts) ──────────────────────

/**
 * Initialize natal chart background generation.
 *
 * 1. Calculates the natal chart (fast, no AI)
 * 2. Stores the partial data in the DB
 * 3. Chains to step 1 via /api/natal/process
 */
export async function startNatalChartBackground(opts: {
  readingId: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  locale: 'ru' | 'uk' | 'en';
  telegramChatId: number;
}): Promise<void> {
  const { readingId, birthDate, birthTime, birthCity, locale, telegramChatId } = opts;

  try {
    // Calculate natal data (fast, no AI)
    const natalData = await calculateNatalChart({ birthDate, birthTime, birthCity });
    const formattedData = formatNatalDataForPrompt(natalData);

    // Store initial partial data so steps can read it
    const partial: PartialData = {
      natalFormattedData: formattedData,
      locale,
      telegramChatId,
      parts: [],
      tracker: { actions: [], risks: [], themes: [] },
    };

    await db.reading.update({
      where: { id: readingId },
      data: {
        natalStep: 0,
        natalPartialData: JSON.stringify(partial),
      },
    });

    // Chain to step 1 (await ensures the HTTP request is actually sent)
    await chainNextStep(readingId, 1);
  } catch (err) {
    console.error('[natal] Failed to initialize pipeline:', err);
    await markFailed(readingId, opts.locale, opts.telegramChatId);
  }
}

// ─── Public: process a single step (called from /api/natal/process) ──────────

export async function processNatalStep(
  readingId: string,
  step: number,
): Promise<{ status: string; step: number }> {
  console.log(`[natal] Processing step ${step}/5 for reading ${readingId}`);

  // Mark that we're attempting this step (prevents polling from re-triggering too soon)
  await db.reading.update({
    where: { id: readingId },
    data: { natalLastAttempt: new Date() },
  }).catch(() => {});

  // Load reading + partial data
  const reading = await db.reading.findUnique({ where: { id: readingId } });
  if (!reading) throw new Error(`Reading ${readingId} not found`);
  if (reading.status !== 'pending') {
    console.log(`[natal] Reading ${readingId} is ${reading.status}, skipping`);
    return { status: reading.status, step };
  }

  const partial: PartialData = JSON.parse(reading.natalPartialData || '{}');
  if (!partial.natalFormattedData) throw new Error('Missing natal data in partial');

  const lang = partial.locale === 'uk' ? 'украинском' : 'русском';
  const langNote = `Пиши строго на ${lang} языке. Допустимы только: MC, ASC, IC, DC.`;
  const data = `АСТРОЛОГИЧЕСКИЕ ДАННЫЕ (рассчитано программно — используй ТОЛЬКО эти данные):\n${partial.natalFormattedData}`;

  try {
    if (step >= 1 && step <= 4) {
      // Steps 1-4: generate one section
      const sysFn = [sys1, () => sys2(partial.tracker), () => sys3(partial.tracker), () => sys4(partial.tracker)];
      const prompts = [
        'Генерируй Большую тройку + Синтез.',
        'Генерируй Личные планеты.',
        'Генерируй Аспекты, Стихии, Карму, Лилит, Ретрограды.',
        'Генерируй Карьеру, Отношения, Карту действий, Портрет.',
      ];
      const maxToks = [2000, 2000, 2000, 2000];

      const sysPrompt = sysFn[step - 1]();
      const userPrompt = `${langNote}\n\n${data}\n\n${prompts[step - 1]}`;

      const result = await safeCallGrok(
        [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
        maxToks[step - 1],
        `Step ${step}`,
      );

      // Update tracker and parts
      partial.tracker = extractTracker(result, partial.tracker);
      partial.parts.push(result);

      // Save progress
      await db.reading.update({
        where: { id: readingId },
        data: {
          natalStep: step,
          natalPartialData: JSON.stringify(partial),
        },
      });

      console.log(`[natal] Step ${step}/5 done for ${readingId}, chaining to ${step + 1}`);
      await chainNextStep(readingId, step + 1);

      return { status: 'processing', step };

    } else if (step === 5) {
      // Step 5: review pass + finalize
      const assembled = `🔮 ТОЛКОВАНИЕ НАТАЛЬНОЙ КАРТЫ\n\n${partial.parts.join('\n\n')}`;
      const final = await safeCallGrok(
        [
          { role: 'system', content: sysReview() },
          { role: 'user', content: `${langNote}\n\nОТРЕДАКТИРУЙ ЭТУ НАТАЛЬНУЮ КАРТУ:\n\n${assembled}` },
        ],
        8000,
        'Step 5 Review',
      );

      // Generate image for the completed chart
      let generatedImage: string | null = null;
      try {
        const imgPrompt = buildImagePrompt({
          spreadId: 'natal_chart',
          cards: [],
          extraContext: 'natal birth chart',
        });
        if (imgPrompt) {
          generatedImage = await generateImage(imgPrompt);
        }
      } catch (imgErr) {
        console.error('[natal] Image generation failed (non-fatal):', imgErr);
      }

      // Save final result
      await db.reading.update({
        where: { id: readingId },
        data: {
          interpretation: final,
          status: 'complete',
          natalStep: 5,
          natalPartialData: null, // clean up
          generatedImage,
        },
      });

      // Send Telegram notification
      try {
        await sendMessage(partial.telegramChatId, NOTIFY_TEXT[partial.locale] || NOTIFY_TEXT.ru);
      } catch (notifyErr) {
        console.error('[natal] Failed to send TG notification:', notifyErr);
      }

      console.log(`[natal] Reading ${readingId} COMPLETE — user notified`);
      return { status: 'complete', step };

    } else {
      throw new Error(`Invalid step: ${step}`);
    }
  } catch (err: any) {
    const msg = err?.message || '';
    const isRecoverable = msg.includes('429') || msg.includes('rate') || msg.includes('limit') ||
      msg.includes('timeout') || msg.includes('budget') || msg.includes('retry via polling') ||
      msg.includes('AbortError') || err?.name === 'AbortError';
    if (isRecoverable) {
      // Don't mark as failed — the polling endpoint will retry this step after 90s
      console.warn(`[natal] Step ${step} recoverable error for ${readingId}: ${msg}`);
      return { status: 'retry_later', step };
    }
    console.error(`[natal] Step ${step} failed for ${readingId}:`, err);
    await markFailed(readingId, partial.locale, partial.telegramChatId);
    return { status: 'failed', step };
  }
}

// ─── Failure handler ─────────────────────────────────────────────────────────

async function markFailed(readingId: string, locale: string, telegramChatId: number): Promise<void> {
  const failMsg = locale === 'uk'
    ? '⚠️ Виникла помилка при генерації натальної карти. Спробуй ще раз.'
    : locale === 'en'
      ? '⚠️ An error occurred while generating your natal chart. Please try again.'
      : '⚠️ Произошла ошибка при генерации натальной карты. Попробуй ещё раз.';

  try {
    // Mark as failed and refund if it was a paid reading
    const reading = await db.reading.update({
      where: { id: readingId },
      data: { interpretation: failMsg, status: 'failed', natalPartialData: null },
      include: { user: true },
    });

    // Refund: if paid with bonus, give it back
    if (reading.isPaid) {
      await db.user.update({
        where: { id: reading.userId },
        data: { bonusReads: { increment: 1 } },
      });
      console.log(`[natal] Refunded bonus read for user ${reading.userId}`);
    }
  } catch (e) {
    console.error('[natal] markFailed DB error:', e);
  }

  try {
    const failNotify = locale === 'uk'
      ? '⚠️ На жаль, натальну карту не вдалося згенерувати. Спробуй ще раз.'
      : locale === 'en'
        ? '⚠️ Sorry, your natal chart could not be generated. Please try again.'
        : '⚠️ К сожалению, натальную карту не удалось сгенерировать. Попробуй ещё раз.';
    await sendMessage(telegramChatId, failNotify);
  } catch { /* ignore */ }
}

/**
 * Synchronous variant — kept for testing or if you prefer to wait.
 */
export async function generateNatalChartMultiStep(
  natalData: string,
  locale: 'ru' | 'uk' | 'en' = 'ru',
): Promise<string> {
  const lang = locale === 'uk' ? 'украинском' : 'русском';
  const langNote = `Пиши строго на ${lang} языке. Допустимы только: MC, ASC, IC, DC.`;
  const data = `АСТРОЛОГИЧЕСКИЕ ДАННЫЕ:\n${natalData}`;
  let tracker: PhraseTracker = { actions: [], risks: [], themes: [] };
  const parts: string[] = [];

  const steps = [
    { sys: sys1(), prompt: 'Генерируй Большую тройку + Синтез.', tokens: 2500 },
    { sys: sys2(tracker), prompt: 'Генерируй Личные планеты.', tokens: 3000 },
    { sys: sys3(tracker), prompt: 'Генерируй Аспекты, Стихии, Карму, Лилит, Ретрограды.', tokens: 3000 },
    { sys: sys4(tracker), prompt: 'Генерируй Карьеру, Отношения, Карту действий, Портрет.', tokens: 2500 },
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const result = await safeCallGrok(
      [{ role: 'system', content: s.sys }, { role: 'user', content: `${langNote}\n\n${data}\n\n${s.prompt}` }],
      s.tokens, `Step ${i + 1}`,
    );
    tracker = extractTracker(result, tracker);
    parts.push(result);
    if (i < steps.length - 1) await sleep(15_000);
  }

  const assembled = `🔮 ТОЛКОВАНИЕ НАТАЛЬНОЙ КАРТЫ\n\n${parts.join('\n\n')}`;
  return safeCallGrok(
    [{ role: 'system', content: sysReview() }, { role: 'user', content: `${langNote}\n\nОТРЕДАКТИРУЙ:\n\n${assembled}` }],
    8000, 'Review',
  );
}
