/**
 * GET  /api/reading — Fetch user's reading history from DB
 * POST /api/reading — Generate a tarot reading
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import {
  callGrok,
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
  generateImage,
  buildImagePrompt,
} from '@/lib/grok';
import { calculateNatalChart, formatNatalDataForPrompt } from '@/lib/natal';
import { drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';
import { checkReadingAccess } from '@/lib/user-limits';
import { validateInitData } from '@/lib/telegram';

// GET — Fetch reading history
export async function GET(req: NextRequest) {
  try {
    const initData = req.nextUrl.searchParams.get('initData') || '';
    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = JSON.parse(tgData.user);
    const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
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
  let user: any = null;
  let access: any = null;

  try {
    // Rate limit: 10 requests per minute per IP
    const rl = checkRateLimit(getRateLimitKey(req, 'reading'), 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { initData, spreadId, question, partnerName, partnerSign, dreamText, answers, birthDate, birthTime, birthCity } = body;

    // Auth
    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tgUser = JSON.parse(tgData.user);
    user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get spread config
    const spread = getSpreadById(spreadId);
    if (!spread) return NextResponse.json({ error: 'Invalid spread' }, { status: 400 });

    // Check access (deducts mana if applicable — refunded in catch on failure)
    access = await checkReadingAccess(user.id, spread);
    if (!access.allowed) {
      return NextResponse.json({
        error: 'Payment required',
        starsCost: access.starsCost,
        needsPayment: true,
      }, { status: 402 });
    }

    const locale = user.locale as 'ru' | 'uk';
    const systemPrompt = buildTarotSystemPrompt(locale);
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
          userPrompt = buildHoroscopePrompt(question, locale);
        } else if (spread.id === 'angel_numbers') {
          userPrompt = buildAngelNumberPrompt(question || '', locale);
        } else if (spread.id === 'past_lives') {
          userPrompt = buildPastLivesPrompt(question, locale);
        } else if (spread.id === 'natal_chart') {
          if (!birthDate || !birthTime || !birthCity) {
            return NextResponse.json({ error: 'Birth date, time and city are required' }, { status: 400 });
          }
          try {
            const natalData = await calculateNatalChart({ birthDate, birthTime, birthCity });
            natalSvgData = natalData.svgData;
            userPrompt = buildNatalChartPrompt(formatNatalDataForPrompt(natalData), locale);
          } catch (natalErr: any) {
            console.error('Natal chart calculation error:', natalErr);
            throw Object.assign(new Error('🌌 Не удалось рассчитать натальную карту. Проверь данные и попробуй снова.'), { name: 'GrokNatalError' });
          }
        } else {
          // Generic esoteric reading (moon_phase, chakra, etc.)
          userPrompt = `Тип: ${spread.name[locale]}\nВопрос/данные: ${question || 'общий запрос'}\nДай мистическое толкование. 3-4 абзаца, ёмко и по сути.`;
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

    // Call Grok AI — keep total tokens (input + output) well under Groq TPM limit
    const interpretation = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      spread.id === 'natal_chart' ? 2500 : spread.id === 'numerology' ? 4000 : spread.cardCount > 5 ? 3000 : 2000,
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

    // Unlock cards in collection
    for (const card of drawnCards) {
      await db.cardCollection.upsert({
        where: { userId_cardId: { userId: user.id, cardId: card.id } },
        create: { userId: user.id, cardId: card.id },
        update: {},
      });
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

    // Refund mana if it was deducted but the AI call failed
    if (access?.manaSpent && user) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { mana: { increment: access.manaSpent } },
        });
      } catch (refundErr) {
        console.error('Failed to refund mana:', refundErr);
      }
    }

    // Return user-friendly message from our custom error classes
    const message = error?.name?.startsWith('Grok')
      ? error.message
      : '🔮 Что-то пошло не так. Попробуй ещё раз через минуту!';
    const status = error?.name === 'GrokRateLimitError' ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
