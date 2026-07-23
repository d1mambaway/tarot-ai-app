/**
 * GET  /api/reading — Fetch user's reading history from DB
 * POST /api/reading — Generate a tarot reading
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
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
  buildMoonPhasePrompt,
  buildChakraPrompt,
  CHAKRA_LABELS,
  generateImage,
  buildImagePrompt,
  buildUserMemoryContext,
  aiPickCards,
} from '@/lib/ai';
import { calculateNatalChart, formatNatalDataForPrompt } from '@/lib/natal';
import { drawCards, ALL_CARDS } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';
import { checkReadingAccess } from '@/lib/user-limits';
import { authenticateRequest } from '@/lib/auth';

// GET — Fetch reading history
export async function GET(req: NextRequest) {
  try {
    const initData = req.nextUrl.searchParams.get('initData') || '';
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const readings = await db.reading.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

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
    });
  } catch (error: any) {
    console.error('Reading history GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 requests per minute per IP
    const rl = await checkRateLimit(getRateLimitKey(req, 'reading'), 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { initData, spreadId, question, partnerName, partnerSign, dreamText, answers, birthDate, birthTime, birthCity } = body;

    // Auth — centralized validation with auth_date expiry check
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    const user = await db.user.findUnique({ where: { telegramId: BigInt(authResult.user.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get spread config
    const spread = getSpreadById(spreadId);
    if (!spread) return NextResponse.json({ error: 'Invalid spread' }, { status: 400 });

    // Check access
    const access = await checkReadingAccess(user.id, spread);
    if (!access.allowed) {
      return NextResponse.json({
        error: 'Payment required',
        starsCost: access.starsCost,
        needsPayment: true,
      }, { status: 402 });
    }

    const locale = user.locale as 'ru' | 'uk';
    const memoryContext = await buildUserMemoryContext(user.id, locale);
    const systemPrompt = buildTarotSystemPrompt(locale, memoryContext);
    let userPrompt: string;
    let natalSvgData: { planets: Record<string, number[]>; cusps: number[] } | undefined;
    let drawnCards: ReturnType<typeof drawCards> = [];

    // Build prompt based on reading type
    switch (spread.category) {
      case 'tarot': {
        const count = spread.cardCount || 3;
        drawnCards = drawCards(count);
        userPrompt = buildReadingPrompt({
          spreadId: spread.id,
          spreadType: spread.name[locale],
          cards: drawnCards.map((c, i) => ({
            name: c.name[locale],
            reversed: c.reversed,
            position: spread.positions?.[i]?.[locale],
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
          userPrompt = buildCompatibilityPrompt(
            { name: user.firstName || '', birthDate: question },
            { name: partnerName, birthDate: partnerSign },
            locale,
          );
        } else if (spread.id === 'runes') {
          drawnCards = drawCards(3);
          userPrompt = buildRunesPrompt(
            drawnCards.map((c) => ({ name: c.name[locale], reversed: c.reversed })),
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
          if (!birthDate || !birthTime || !birthCity) {
            return NextResponse.json({ error: 'Birth date, time and city are required' }, { status: 400 });
          }
          const natalData = await calculateNatalChart({ birthDate, birthTime, birthCity });
          natalSvgData = natalData.svgData;
          userPrompt = buildNatalChartPrompt(formatNatalDataForPrompt(natalData), locale);
        } else if (spread.id === 'moon_phase') {
          userPrompt = buildMoonPhasePrompt(locale, memoryContext);
        } else if (spread.id === 'chakra') {
          const picks = await aiPickCards(7, 'анализ чакр и энергетики', 'Чакры', CHAKRA_LABELS, locale);
          drawnCards = picks.map((pick) => {
            const card = ALL_CARDS.find((c) => c.id === pick.id) || ALL_CARDS[0];
            return { ...card, reversed: pick.reversed };
          });
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

    const interpretation = spread.id === 'natal_chart'
      ? await callOpenRouter(messages, 4000)
      : await callGrok(
          messages,
          spread.id === 'numerology' ? 4000 : spread.cardCount > 5 ? 3000 : 2000,
        );

    // Wait for image (already running in parallel)
    const generatedImage = await imagePromise;

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
          image: c.image,
        })),
        interpretation,
        locale,
        isPaid: access.reason !== 'free',
        partnerName,
        partnerSign,
      },
    });

    // Update free reads counter
    if (access.reason === 'free') {
      await db.user.update({
        where: { id: user.id },
        data: { freeReadsToday: { increment: 1 } },
      });
    } else if (access.reason === 'bonus') {
      await db.user.update({
        where: { id: user.id },
        data: { bonusReads: { decrement: 1 } },
      });
    }

    // Unlock cards in collection (batch — avoids N+1 queries)
    if (drawnCards.length > 0) {
      const existing = await db.cardCollection.findMany({
        where: { userId: user.id, cardId: { in: drawnCards.map(c => c.id) } },
        select: { cardId: true },
      });
      const existingIds = new Set(existing.map(c => c.cardId));
      const newCards = drawnCards
        .filter(c => !existingIds.has(c.id))
        .map(c => ({ userId: user.id, cardId: c.id }));
      if (newCards.length > 0) {
        await db.cardCollection.createMany({ data: newCards, skipDuplicates: true });
      }
    }

    // Get updated user mana balance
    const updatedUser = await db.user.findUnique({ where: { id: user.id }, select: { mana: true } });

    return NextResponse.json({
      id: reading.id,
      cards: drawnCards.map((c) => ({
        id: c.id,
        name: c.name[locale],
        reversed: c.reversed,
        image: c.image,
        keywords: c.reversed ? c.reversedKeywords[locale] : c.keywords[locale],
      })),
      interpretation,
      generatedImage,
      ...(natalSvgData && { natalChartData: natalSvgData }),
      newCardsUnlocked: drawnCards.map((c) => c.id),
      newMana: updatedUser?.mana ?? user.mana,
    });
  } catch (error: any) {
    console.error('Reading API error:', error);
    // Return user-friendly message from our custom error classes
    const message = error?.name?.startsWith('Grok')
      ? error.message
      : '🔮 Что-то пошло не так. Попробуй ещё раз через минуту!';
    const status = error?.name === 'GrokRateLimitError' ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
