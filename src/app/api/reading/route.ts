/**
 * GET  /api/reading — Fetch user's reading history from DB
 * POST /api/reading — Generate a tarot reading
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import {
  callGrok,
  callOpenRouter,
  buildTarotSystemPrompt,
  buildReadingPrompt,
  buildDreamPrompt,
  buildNumerologyPrompt,
  buildCompatibilityPrompt,
  buildPsychPortraitPrompt,
  buildHoroscopePrompt,
  buildAngelNumberPrompt,
  buildRunesPrompt,
  buildPastLivesPrompt,
  buildNatalChartPrompt,
  buildDestinyMatrixPrompt,
  buildMoonPhasePrompt,
  buildChakraPrompt,
  CHAKRA_LABELS,
  generateImage,
  buildImagePrompt,
  buildUserMemoryContext,
  withDeadline,
} from '@/lib/ai';
import { calculateNatalChart, formatNatalDataForPrompt } from '@/lib/natal';
import { calculateDestinyMatrix, formatMatrixForPrompt } from '@/lib/matrix';
import { drawCards } from '@/data/tarot-cards';
import { drawRunes, type DrawnRune } from '@/data/runes';
import { getSpreadById } from '@/data/spreads';
import { checkReadingAccess, refundReadingAccess } from '@/lib/user-limits';
import type { AccessResult } from '@/lib/user-limits';
import { authenticateRequest } from '@/lib/auth';
import { recordDraws } from '@/lib/collection';
import { cardImage, getDeck } from '@/data/decks';

// Long reports (natal, matrix) take 20-40 s. The AI deadline below is shorter
// than this, so a slow model fails inside the function and the catch block
// refunds the user — instead of Vercel killing the function mid-flight.
export const maxDuration = 60;
const AI_DEADLINE_MS = 52_000;
const IMAGE_GRACE_MS = 5_000;

// GET — Fetch reading history
export async function GET(req: NextRequest) {
  try {
    const initData = req.nextUrl.searchParams.get('initData') || '';
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Paged: 100 newest by default; `before` (ISO date of the oldest reading
    // the client has) loads the next page. `total` is the real count, so the
    // profile no longer tops out at 100.
    const PAGE = 100;
    const beforeRaw = req.nextUrl.searchParams.get('before');
    const before = beforeRaw ? new Date(beforeRaw) : null;
    const where = {
      userId: user.id,
      ...(before && !isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
    };
    const [readings, total] = await Promise.all([
      db.reading.findMany({ where, orderBy: { createdAt: 'desc' }, take: PAGE + 1 }),
      db.reading.count({ where: { userId: user.id } }),
    ]);
    const hasMore = readings.length > PAGE;
    if (hasMore) readings.pop();

    return NextResponse.json({
      readings: readings.map((r) => ({
        id: r.id,
        spreadId: r.type.toLowerCase(),
        type: r.type,
        cards: r.cards,
        interpretation: r.interpretation,
        question: r.question,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('Reading history GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Tracked outside the try so a failure after access was consumed can refund it
  let charged: { userId: string; access: AccessResult } | null = null;

  try {
    const body = await req.json();
    const { initData, spreadId, question, partnerName, partnerSign, dreamText, answers, birthDate, birthTime, birthCity } = body;

    // Auth — centralized validation with auth_date expiry check
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    // Rate limit: 10 readings per minute per Telegram user (not per IP —
    // mobile carriers share one address across thousands of users)
    const rl = await checkRateLimit(getUserRateLimitKey(authResult.user.id, 'reading'), 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get spread config
    const spread = getSpreadById(spreadId);
    if (!spread) return NextResponse.json({ error: 'Invalid spread' }, { status: 400 });

    // ─── Validate input BEFORE charging ────────────────────────────────
    // Before, a bad matrix date or missing natal field returned 400 after the
    // mana (up to 1111) was already taken, with no refund.
    let natalData: Awaited<ReturnType<typeof calculateNatalChart>> | undefined;
    let matrix: ReturnType<typeof calculateDestinyMatrix> | undefined;
    if (spread.id === 'natal_chart') {
      if (!birthDate || !birthTime || !birthCity) {
        return NextResponse.json({ error: 'Birth date, time and city are required' }, { status: 400 });
      }
      try {
        natalData = await calculateNatalChart({ birthDate, birthTime, birthCity });
      } catch (e) {
        console.error('Natal calc failed:', e);
        return NextResponse.json({ error: 'Invalid birth data' }, { status: 400 });
      }
    } else if (spread.id === 'destiny_matrix') {
      if (!question) {
        return NextResponse.json({ error: 'Birth date is required' }, { status: 400 });
      }
      try {
        matrix = calculateDestinyMatrix(question);
      } catch {
        return NextResponse.json({ error: 'Invalid birth date' }, { status: 400 });
      }
    }

    // Check access — free read / bonus / mana is claimed atomically here
    const access = await checkReadingAccess(user.id, spread);
    if (access.allowed && access.consumed) {
      charged = { userId: user.id, access };
    }
    if (!access.allowed) {
      if (access.needsPremium) {
        return NextResponse.json({ error: 'Premium required', needsPremium: true }, { status: 403 });
      }
      return NextResponse.json({
        error: 'Payment required',
        starsCost: access.starsCost,
        needsPayment: true,
      }, { status: 402 });
    }

    const locale = (['ru', 'uk', 'en'].includes(user.locale) ? user.locale : 'ru') as 'ru' | 'uk' | 'en';
    // The user's deck decides the card art (meanings are the same in every deck)
    const deckId = getDeck(user.deckId).id;
    const memoryContext = await buildUserMemoryContext(user.id, locale);
    const systemPrompt = buildTarotSystemPrompt(locale, memoryContext, {
      name: user.displayName || user.firstName,
      gender: user.gender,
    });
    let userPrompt: string;
    let natalSvgData: { planets: Record<string, number[]>; cusps: number[] } | undefined;
    // The matrix chart is pure math over the birth date, so history can redraw it from the date alone
    let matrixDate: string | undefined;
    let drawnCards: ReturnType<typeof drawCards> = [];
    let drawnRunes: DrawnRune[] = [];

    // Build prompt based on reading type
    switch (spread.category) {
      case 'tarot': {
        const count = spread.cardCount || 3;
        drawnCards = drawCards(count);
        userPrompt = buildReadingPrompt({
          spreadId: spread.id,
          spreadType: spread.name[locale],
          // Keywords anchor the model to the card's actual meaning
          cards: drawnCards.map((c, i) => ({
            name: c.name[locale],
            reversed: c.reversed,
            position: spread.positions?.[i]?.[locale],
            keywords: c.reversed ? c.reversedKeywords[locale] : c.keywords[locale],
          })),
          question,
          locale,
        });
        break;
      }
      case 'esoteric': {
        if (spread.id === 'dream') {
          userPrompt = buildDreamPrompt(dreamText, locale);
        } else if (spread.id === 'numerology') {
          userPrompt = buildNumerologyPrompt(user.firstName || 'Пользователь', question, locale);
        } else if (spread.id === 'compatibility') {
          // The form only asks about the partner — the user's own date comes from the profile
          userPrompt = buildCompatibilityPrompt(
            {
              name: user.displayName || user.firstName || '',
              birthDate: question || user.birthDate?.toISOString().slice(0, 10),
            },
            { name: partnerName, birthDate: partnerSign },
            locale,
          );
        } else if (spread.id === 'runes') {
          // Real Elder Futhark runes (this used to draw tarot cards)
          drawnRunes = drawRunes(3);
          userPrompt = buildRunesPrompt(
            drawnRunes.map((r) => ({ name: `${r.glyph} ${r.name[locale]}`, reversed: r.reversed, meaning: r.meaning[locale] })),
            question,
            locale,
          );
        } else if (spread.id === 'horoscope') {
          userPrompt = buildHoroscopePrompt(question, locale, memoryContext);
        } else if (spread.id === 'angel_numbers') {
          userPrompt = buildAngelNumberPrompt(question || '', locale);
        } else if (spread.id === 'past_lives') {
          userPrompt = buildPastLivesPrompt(question, locale);
        } else if (spread.id === 'natal_chart') {
          natalSvgData = natalData!.svgData;
          userPrompt = buildNatalChartPrompt(formatNatalDataForPrompt(natalData!), locale);
        } else if (spread.id === 'destiny_matrix') {
          matrixDate = matrix!.input.date;
          userPrompt = buildDestinyMatrixPrompt(formatMatrixForPrompt(matrix!, locale), locale);
        } else if (spread.id === 'moon_phase') {
          userPrompt = buildMoonPhasePrompt(locale, memoryContext);
        } else if (spread.id === 'chakra') {
          // One honestly random card per chakra (was picked by the model)
          drawnCards = drawCards(CHAKRA_LABELS.length);
          userPrompt = buildChakraPrompt(
            drawnCards.map((c) => ({ name: c.name[locale], reversed: c.reversed })),
            locale,
            memoryContext,
          );
        } else {
          // Generic esoteric fallback for any future spread without a dedicated prompt
          userPrompt = `Тип: ${spread.name[locale]}\nВопрос/данные: ${question || 'общий запрос'}\nДай ДЕТАЛЬНОЕ мистическое толкование, минимум 4-5 абзацев, без общих фраз, максимально конкретно под этот тип запроса.`;
        }
        break;
      }
      case 'personal': {
        userPrompt = buildPsychPortraitPrompt(answers || [question], locale);
        break;
      }
      default:
        userPrompt = question || 'Общий расклад';
    }

    // Start image generation in parallel (non-blocking)
    const imagePrompt = buildImagePrompt({
      spreadId: spread.id,
      cards: drawnCards.map((c) => ({ name: c.name[locale], reversed: c.reversed })),
      question: dreamText || question,
      extraContext: spread.id === 'numerology' ? question : spread.id === 'natal_chart' ? 'natal birth chart' : undefined,
    });
    const imagePromise = imagePrompt ? generateImage(imagePrompt) : Promise.resolve(null);

    // Call AI — natal uses OpenRouter (no TPM issues), rest uses Groq
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    // Long esoteric reports go through OpenRouter — Groq's TPM limit truncates them
    const aiText = await withDeadline(
      spread.id === 'natal_chart' || spread.id === 'destiny_matrix'
        ? callOpenRouter(messages, 4000)
        : callGrok(
            messages,
            spread.id === 'numerology' ? 4000 : spread.cardCount > 5 ? 3000 : 2000,
          ),
      AI_DEADLINE_MS,
    );

    const interpretation = aiText;

    // The image is a nice-to-have: never let it hold the reading past a short grace period
    const generatedImage = await Promise.race([
      imagePromise.catch(() => null),
      new Promise<null>((r) => setTimeout(() => r(null), IMAGE_GRACE_MS)),
    ]);

    // Save to DB
    const reading = await db.reading.create({
      data: {
        userId: user.id,
        type: spread.type as any,
        question,
        cards: drawnCards.map((c) => ({
          id: c.id,
          name: c.name[locale],
          reversed: c.reversed,
          image: cardImage(c, deckId),
        })),
        interpretation,
        locale,
        isPaid: access.reason === 'mana',
        manaCost: access.manaSpent ?? 0,
        partnerName,
        partnerSign,
      },
    });

    // Reading delivered — the access consumed in checkReadingAccess() stays spent
    charged = null;

    // Premium savings counter: what this reading would have cost without premium
    let premiumSaved: number | undefined;
    if (access.reason === 'premium' && spread.manaCost > 0) {
      const u = await db.user.update({
        where: { id: user.id },
        data: { premiumSaved: { increment: spread.manaCost } },
        select: { premiumSaved: true },
      });
      premiumSaved = u.premiumSaved;
    }

    // Unlock cards in the active deck's collection, count repeat draws
    if (drawnCards.length > 0) {
      await recordDraws(user.id, deckId, drawnCards.map((c) => c.id));
    }

    // Get updated user mana balance
    const updatedUser = await db.user.findUnique({ where: { id: user.id }, select: { mana: true } });

    return NextResponse.json({
      id: reading.id,
      cards: drawnCards.map((c) => ({
        id: c.id,
        name: c.name[locale],
        reversed: c.reversed,
        image: cardImage(c, deckId),
        keywords: c.reversed ? c.reversedKeywords[locale] : c.keywords[locale],
      })),
      interpretation,
      generatedImage,
      ...(natalSvgData && { natalChartData: natalSvgData }),
      ...(matrixDate && { matrixDate }),
      newCardsUnlocked: drawnCards.map((c) => c.id),
      newMana: updatedUser?.mana ?? user.mana,
      accessReason: access.reason,
      ...(premiumSaved !== undefined && { premiumSaved }),
    });
  } catch (error: any) {
    console.error('Reading API error:', error);

    // The user paid (mana / free read / bonus) but got no reading — give it back
    if (charged) {
      await refundReadingAccess(charged.userId, charged.access);
    }

    // Return user-friendly message from our custom error classes
    const message = error?.name?.startsWith('Grok')
      ? error.message
      : '🔮 Что-то пошло не так. Попробуй ещё раз через минуту!';
    const status = error?.name === 'GrokRateLimitError' ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
