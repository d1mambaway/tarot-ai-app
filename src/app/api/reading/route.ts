/**
 * POST /api/reading — Generate a tarot reading
 * Draws cards, calls Grok for interpretation, saves to DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callGrok, buildTarotSystemPrompt, buildReadingPrompt, buildDreamPrompt, buildNumerologyPrompt, buildCompatibilityPrompt, buildPsychPortraitPrompt } from '@/lib/grok';
import { drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';
import { checkReadingAccess } from '@/lib/user-limits';
import { validateInitData } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, spreadId, question, partnerName, partnerSign, dreamText, answers, photo } = body;

    // Auth
    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tgUser = JSON.parse(tgData.user);
    const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
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
    const systemPrompt = buildTarotSystemPrompt(locale);
    let userPrompt: string;
    let drawnCards: ReturnType<typeof drawCards> = [];

    // Build prompt based on reading type
    switch (spread.category) {
      case 'tarot': {
        const count = spread.cardCount || 3; // AI picks for free_question
        drawnCards = drawCards(count);
        userPrompt = buildReadingPrompt({
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
      case 'mystic': {
        if (spread.id === 'dream') {
          userPrompt = buildDreamPrompt(dreamText, locale);
        } else if (spread.id === 'numerology') {
          userPrompt = buildNumerologyPrompt(user.firstName || 'Unknown', question, locale);
        } else if (spread.id === 'compatibility') {
          userPrompt = buildCompatibilityPrompt(
            { name: user.firstName || '', birthDate: question },
            { name: partnerName, birthDate: partnerSign },
            locale,
          );
        } else if (spread.id === 'runes') {
          drawnCards = drawCards(3); // use tarot cards as rune analogy for now
          userPrompt = buildReadingPrompt({
            spreadType: 'Руны',
            cards: drawnCards.map((c) => ({ name: c.name[locale], reversed: c.reversed })),
            question,
            locale,
          });
        } else {
          // Generic mystic reading
          userPrompt = `Тип: ${spread.name[locale]}\nВопрос/данные: ${question || 'общий запрос'}\nДай подробную интерпретацию.`;
        }
        break;
      }
      case 'photo': {
        // Photo analysis (palm/aura) — send photo description to AI
        userPrompt = `Тип: ${spread.name[locale]}\nПользователь прислал фото. Дай мистическую интерпретацию на основе ${spread.id === 'palm_reading' ? 'линий ладони' : 'энергетики фото и ауры'}.`;
        break;
      }
      case 'personal': {
        userPrompt = buildPsychPortraitPrompt(answers || [question], locale);
        break;
      }
      default:
        userPrompt = question || 'Общий расклад';
    }

    // Call Grok AI
    const interpretation = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      spread.cardCount > 5 ? 3000 : 2000,
    );

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
      newCardsUnlocked: drawnCards.map((c) => c.id),
    });
  } catch (error) {
    console.error('Reading API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
