/**
 * POST /api/reading-lite — Lightweight reading (no DB required)
 * Used as fallback when DB is not yet set up
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGrok, buildTarotSystemPrompt, buildReadingPrompt, buildDreamPrompt, buildNumerologyPrompt, buildCompatibilityPrompt, buildPsychPortraitPrompt } from '@/lib/grok';
import { drawCards } from '@/data/tarot-cards';
import { getSpreadById } from '@/data/spreads';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spreadId, question, partnerName, partnerSign, dreamText, answers } = body;

    const spread = getSpreadById(spreadId);
    if (!spread) return NextResponse.json({ error: 'Invalid spread' }, { status: 400 });

    const locale = 'ru' as const; // Default to Russian for lite mode
    const systemPrompt = buildTarotSystemPrompt(locale);
    let userPrompt: string;
    let drawnCards: ReturnType<typeof drawCards> = [];

    switch (spread.category) {
      case 'tarot': {
        const count = spread.cardCount || 3;
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
          userPrompt = buildDreamPrompt(dreamText || question || 'странный сон', locale);
        } else if (spread.id === 'numerology') {
          userPrompt = buildNumerologyPrompt('Пользователь', question || '01.01.2000', locale);
        } else if (spread.id === 'compatibility') {
          userPrompt = buildCompatibilityPrompt(
            { name: 'Пользователь', birthDate: question },
            { name: partnerName || 'Партнёр', birthDate: partnerSign },
            locale,
          );
        } else if (spread.id === 'runes') {
          drawnCards = drawCards(3);
          userPrompt = buildReadingPrompt({
            spreadType: 'Руны',
            cards: drawnCards.map((c) => ({ name: c.name[locale], reversed: c.reversed })),
            question,
            locale,
          });
        } else if (spread.id === 'angel_numbers') {
          userPrompt = `Число: ${question || '111'}\n\nДай мистическую интерпретацию ангельского числа. Что оно значит, почему человек его видит, и какое послание несёт.`;
        } else if (spread.id === 'moon_phase') {
          const now = new Date();
          userPrompt = `Сегодня ${now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.\n\nДай рекомендации по лунному календарю на сегодня: фаза луны, что рекомендуется делать, от чего воздержаться, энергетика дня.`;
        } else if (spread.id === 'horoscope') {
          userPrompt = `Дата рождения: ${question || 'не указана'}\n\nДай персональный гороскоп на сегодня и ближайшую неделю. Включи любовь, карьеру, здоровье, и совет дня.`;
        } else if (spread.id === 'past_lives') {
          userPrompt = `Дата рождения: ${question || 'не указана'}\n\nРасскажи кем был этот человек в прошлой жизни. Придумай детальную, увлекательную историю с конкретными деталями, эпохой, и связью с текущей жизнью.`;
        } else if (spread.id === 'chakra') {
          drawnCards = drawCards(7);
          userPrompt = `Расклад на 7 чакр. Каждая карта соответствует чакре:\n${drawnCards.map((c, i) => `Чакра ${i+1}: ${c.name[locale]}${c.reversed ? ' (перевёрнута)' : ''}`).join('\n')}\n\nДай анализ каждой чакры: открыта/закрыта, что это значит, и как балансировать.`;
        } else {
          userPrompt = `Тип: ${spread.name[locale]}\nВопрос: ${question || 'общий запрос'}\nДай подробную мистическую интерпретацию.`;
        }
        break;
      }
      case 'photo': {
        userPrompt = `Тип: ${spread.name[locale]}\nДай мистическую интерпретацию ${spread.id === 'palm_reading' ? 'линий ладони' : 'ауры человека'}. Поскольку фото сейчас недоступно, дай общие рекомендации в мистическом стиле.`;
        break;
      }
      case 'personal': {
        userPrompt = buildPsychPortraitPrompt(answers || [question || 'Хочу узнать о себе'], locale);
        break;
      }
      default:
        userPrompt = question || 'Общий расклад';
    }

    const interpretation = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      spread.cardCount > 5 ? 3000 : 2000,
    );

    return NextResponse.json({
      id: `lite_${Date.now()}`,
      cards: drawnCards.map((c) => ({
        id: c.id,
        name: c.name[locale],
        reversed: c.reversed,
        image: c.image,
        keywords: c.reversed ? c.reversedKeywords[locale] : c.keywords[locale],
      })),
      interpretation,
    });
  } catch (error: any) {
    console.error('Reading-lite API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
