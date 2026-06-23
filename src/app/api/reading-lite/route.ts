/**
 * POST /api/reading-lite — Lightweight reading (no DB required)
 * 2-step AI: 1) AI picks cards relevant to the question  2) AI interprets them deeply
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import {
  callGrok,
  callGrokJSON,
  buildTarotSystemPrompt,
  buildCardSelectionPrompt,
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
  generateImage,
  buildImagePrompt,
} from '@/lib/grok';
import { calculateNatalChart, formatNatalDataForPrompt } from '@/lib/natal';
import { validateInitData, parseUserFromInitData } from '@/lib/telegram';
import { ALL_CARDS, drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';

// Build a compact deck summary for the AI card-selection step
function buildDeckSummary(locale: 'ru' | 'uk' | 'en'): string {
  return ALL_CARDS.map((c) => {
    const kw = c.keywords[locale]?.slice(0, 2).join(', ') || '';
    return `${c.id}: ${c.name[locale]}${kw ? ` (${kw})` : ''}`;
  }).join('\n');
}

/**
 * AI-guided card selection: asks the AI to choose cards that best answer the question.
 * Falls back to random draw if AI response is unparseable.
 */
async function aiPickCards(
  count: number,
  question: string | undefined,
  spreadType: string,
  positions: string[] | undefined,
  locale: 'ru' | 'uk' | 'en',
): Promise<{ id: number; reversed: boolean }[]> {
  try {
    const deckSummary = buildDeckSummary(locale);
    const prompt = buildCardSelectionPrompt({
      count,
      question,
      spreadType,
      positions,
      deckSummary,
      locale,
    });

    const raw = await callGrokJSON(
      [
        { role: 'system', content: 'Ты таролог. Отвечай ТОЛЬКО валидным JSON.' },
        { role: 'user', content: prompt },
      ],
      500,
    );

    const parsed = JSON.parse(raw);
    if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length >= count) {
      // Validate card IDs exist
      const validCards = parsed.cards
        .filter((c: any) => typeof c.id === 'number' && c.id >= 0 && c.id <= 77)
        .slice(0, count);

      if (validCards.length === count) {
        return validCards.map((c: any) => ({ id: c.id, reversed: !!c.reversed }));
      }
    }
  } catch (e) {
    console.error('AI card selection failed, using random:', e);
  }

  // Fallback: random draw
  return drawCards(count).map((c) => ({ id: c.id, reversed: c.reversed }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, spreadId, question, partnerName, partnerSign, dreamText, answers, birthDate, birthTime, birthCity, locale: reqLocale } = body;

    // Rate limit: 10 requests per minute per IP
    const rl = checkRateLimit(getRateLimitKey(req, 'reading-lite'), 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Auth — require valid Telegram initData
    if (!initData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { valid } = validateInitData(initData);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const maxTokens = isNumerology ? 6000 : isNatalChart ? 3000 : isDeep ? 4000 : 3000;

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
          const tgUser = parseUserFromInitData(initData);
          const userName = tgUser?.firstName || 'Пользователь';
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
          const now = new Date();
          userPrompt = `Сегодня ${now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.

Дай ДЕТАЛЬНЫЕ рекомендации по лунному календарю. Минимум 5 абзацев.

🌙 Текущая фаза луны — какая фаза и что она значит
✨ Энергетика дня — общий фон
✅ Что делать — конкретные рекомендации
❌ Чего избегать — предупреждения
💫 Ритуал дня — простая практика для усиления энергии`;
        } else if (spread.id === 'chakra') {
          const picks = await aiPickCards(7, 'анализ чакр и энергетики', 'Чакры', [
            'Муладхара (корневая)',
            'Свадхистхана (сакральная)',
            'Манипура (солнечное сплетение)',
            'Анахата (сердечная)',
            'Вишуддха (горловая)',
            'Аджна (третий глаз)',
            'Сахасрара (коронная)',
          ], locale);
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
          const chakraNames = ['Муладхара 🔴', 'Свадхистхана 🟠', 'Манипура 🟡', 'Анахата 💚', 'Вишуддха 🔵', 'Аджна 🟣', 'Сахасрара 👑'];
          userPrompt = `Расклад на 7 чакр:\n${selectedCards.map((c, i) => `${chakraNames[i]}: ${c.name}${c.reversed ? ' (перевёрнута)' : ''}`).join('\n')}\n\nДай ДЕТАЛЬНЫЙ анализ каждой чакры. Минимум 7 абзацев (по одному на чакру) + итог.\nДля каждой: открыта/заблокирована, что это значит в жизни, и как балансировать.`;
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
          userPrompt = `Тип: ${spread.name[locale]}\nВопрос: ${question || 'общий запрос'}\nДай мистическое толкование. 3-4 абзаца. Минимум 4 абзаца.`;
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

    // Main AI call — interpretation
    // Natal chart: skip system prompt + use 8b-instant (20k TPM vs 6k for 70b)
    const msgs = isNatalChart
      ? [{ role: 'user' as const, content: userPrompt }]
      : [{ role: 'system' as const, content: systemPrompt }, { role: 'user' as const, content: userPrompt }];
    const interpretation = await callGrok(
      msgs,
      maxTokens,
      isNatalChart ? 'llama-3.1-8b-instant' : undefined,
    );

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
