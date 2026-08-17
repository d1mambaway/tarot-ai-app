/**
 * POST /api/reading-lite — Lightweight reading (no DB required)
 * 2-step AI: 1) AI picks cards relevant to the question  2) AI interprets them deeply
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rate-limit';
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
  buildPastLivesPrompt,
  buildAngelNumberPrompt,
  buildRunesPrompt,
  buildNatalChartPrompt,
  buildMoonPhasePrompt,
  buildChakraPrompt,
  CHAKRA_LABELS,
  generateImage,
  buildImagePrompt,
  aiPickCards,
} from '@/lib/ai';
import { calculateNatalChart, formatNatalDataForPrompt } from '@/lib/natal';
import { authenticateRequest } from '@/lib/auth';
import { ALL_CARDS, drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, spreadId, question, partnerName, partnerSign, dreamText, answers, birthDate, birthTime, birthCity, locale: reqLocale } = body;

    // Auth — centralized validation with auth_date expiry check
    const authResult = authenticateRequest(initData);
    if (authResult instanceof NextResponse) return authResult;

    // Rate limit per Telegram user, not per IP
    const rl = await checkRateLimit(getUserRateLimitKey(authResult.user.id, 'reading-lite'), 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const spread = getSpreadById(spreadId);
    if (!spread) return NextResponse.json({ error: 'Invalid spread' }, { status: 400 });

    const locale = (reqLocale === 'uk' ? 'uk' : reqLocale === 'en' ? 'en' : 'ru') as 'ru' | 'uk' | 'en';
    const systemPrompt = buildTarotSystemPrompt(locale);
    let userPrompt: string;
    let natalSvgData: { planets: Record<string, number[]>; cusps: number[] } | undefined;
    let selectedCards: { id: number; name: string; reversed: boolean; image: string; keywords: string[] }[] = [];

    // Determine token budget based on complexity
    const isNumerology = spread.id === 'numerology';
    const isNatalChart = spread.id === 'natal_chart';
    const isDeep = spread.cardCount >= 5 || ['celtic_cross', 'relationship', 'weekly'].includes(spread.id);
    const maxTokens = isNumerology ? 6000 : isNatalChart ? 2500 : isDeep ? 4000 : 3000;

    switch (spread.category) {
      case 'tarot': {
        const count = spread.cardCount || 3;
        const positions = spread.positions?.map((p) => p[locale]);

        // Step 1: AI picks cards that match the question
        const picks = await aiPickCards(
          count === 0 ? 3 : count,
          question,
          spread.name[locale],
          positions,
          locale,
        );

        // Map picks to full card data
        selectedCards = picks.map((pick) => {
          const card = ALL_CARDS.find((c) => c.id === pick.id) || ALL_CARDS[0];
          const kw = pick.reversed ? card.reversedKeywords[locale] : card.keywords[locale];
          return {
            id: card.id,
            name: card.name[locale],
            reversed: pick.reversed,
            image: card.image,
            keywords: kw || [],
          };
        });

        // Step 2: Deep interpretation with spread-specific prompt
        userPrompt = buildReadingPrompt({
          spreadId: spread.id,
          spreadType: spread.name[locale],
          cards: selectedCards.map((c, i) => ({
            name: c.name,
            reversed: c.reversed,
            position: spread.positions?.[i]?.[locale],
            keywords: c.keywords,
          })),
          question,
          locale,
        });
        break;
      }
      case 'esoteric': {
        if (spread.id === 'dream') {
          userPrompt = buildDreamPrompt(dreamText || question || 'странный сон', locale);
        } else if (spread.id === 'numerology') {
          const userName = authResult.user.firstName || 'Пользователь';
          userPrompt = buildNumerologyPrompt(userName, question || '01.01.2000', locale);
        } else if (spread.id === 'compatibility') {
          userPrompt = buildCompatibilityPrompt(
            { name: 'Пользователь', birthDate: question },
            { name: partnerName || 'Партнёр', birthDate: partnerSign },
            locale,
          );
        } else if (spread.id === 'horoscope') {
          userPrompt = buildHoroscopePrompt(question || 'не указана', locale);
        } else if (spread.id === 'past_lives') {
          userPrompt = buildPastLivesPrompt(question || 'не указана', locale);
        } else if (spread.id === 'angel_numbers') {
          userPrompt = buildAngelNumberPrompt(question || '111', locale);
        } else if (spread.id === 'runes') {
          const picks = await aiPickCards(3, question, 'Руны', undefined, locale);
          selectedCards = picks.map((pick) => {
            const card = ALL_CARDS.find((c) => c.id === pick.id) || ALL_CARDS[0];
            return {
              id: card.id,
              name: card.name[locale],
              reversed: pick.reversed,
              image: card.image,
              keywords: (pick.reversed ? card.reversedKeywords[locale] : card.keywords[locale]) || [],
            };
          });
          userPrompt = buildRunesPrompt(
            selectedCards.map((c) => ({ name: c.name, reversed: c.reversed })),
            question,
            locale,
          );
        } else if (spread.id === 'moon_phase') {
          userPrompt = buildMoonPhasePrompt(locale);
        } else if (spread.id === 'chakra') {
          const picks = await aiPickCards(7, 'анализ чакр и энергетики', 'Чакры', CHAKRA_LABELS, locale);
          selectedCards = picks.map((pick) => {
            const card = ALL_CARDS.find((c) => c.id === pick.id) || ALL_CARDS[0];
            return {
              id: card.id,
              name: card.name[locale],
              reversed: pick.reversed,
              image: card.image,
              keywords: (pick.reversed ? card.reversedKeywords[locale] : card.keywords[locale]) || [],
            };
          });
          userPrompt = buildChakraPrompt(
            selectedCards.map((c) => ({ name: c.name, reversed: c.reversed })),
            locale,
          );
        } else if (spread.id === 'natal_chart') {
          if (!birthDate || !birthTime || !birthCity) {
            return NextResponse.json({ error: 'Birth date, time and city are required' }, { status: 400 });
          }
          const natalData = await calculateNatalChart({
            birthDate, birthTime, birthCity,
          });
          natalSvgData = natalData.svgData;
          const formattedData = formatNatalDataForPrompt(natalData);
          userPrompt = buildNatalChartPrompt(formattedData, locale);
        } else {
          userPrompt = `Тип: ${spread.name[locale]}\nВопрос/данные: ${question || 'общий запрос'}\nДай ДЕТАЛЬНОЕ мистическое толкование, минимум 4-5 абзацев, без общих фраз, максимально конкретно под этот тип запроса.`;
        }
        break;
      }
      case 'personal': {
        userPrompt = buildPsychPortraitPrompt(answers || [question || 'Хочу узнать о себе'], locale);
        break;
      }
      default:
        userPrompt = question || 'Общий расклад';
    }

    // Start image generation in parallel (non-blocking)
    const imagePrompt = buildImagePrompt({
      spreadId: spread.id,
      cards: selectedCards.map((c) => ({ name: c.name, reversed: c.reversed })),
      question: dreamText || question,
      extraContext: spread.id === 'numerology' ? question : spread.id === 'natal_chart' ? 'natal birth chart' : undefined,
    });
    const imagePromise = imagePrompt ? generateImage(imagePrompt) : Promise.resolve(null);

    // Main AI call — natal uses OpenRouter, rest uses Groq
    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];
    const interpretation = isNatalChart
      ? await callOpenRouter(aiMessages, 4000)
      : await callGrok(aiMessages, maxTokens);

    // Wait for image
    const generatedImage = await imagePromise;

    return NextResponse.json({
      id: `lite_${Date.now()}`,
      cards: selectedCards,
      interpretation,
      generatedImage,
      ...(natalSvgData && { natalChartData: natalSvgData }),
    });
  } catch (error: any) {
    console.error('Reading-lite API error:', error);
    const message = error?.name?.startsWith('Grok')
      ? error.message
      : '🔮 Что-то пошло не так. Попробуй ещё раз через минуту!';
    const status = error?.name === 'GrokRateLimitError' ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
