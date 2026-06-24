import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { callGrok, buildTarotSystemPrompt } from '@/lib/ai';
import { validateInitData } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 requests per minute per IP
    const rl = await checkRateLimit(getRateLimitKey(req, 'followup'), 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { initData, readingId, question } = body;

    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = JSON.parse(tgData.user);
    const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check mana (follow-up costs 50 mana)
    const FOLLOWUP_COST = 111;
    if (user.mana < FOLLOWUP_COST) {
      return NextResponse.json({ error: 'Not enough mana', needsMana: true }, { status: 402 });
    }

    // Get original reading
    const reading = await db.reading.findUnique({ where: { id: readingId } });
    if (!reading || reading.userId !== user.id) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    const locale = (user.locale as 'ru' | 'uk' | 'en') || 'ru';
    const systemPrompt = buildTarotSystemPrompt(locale);

    const followUpPrompts: Record<string, string> = {
      ru: `Дополнительный вопрос пользователя по этому раскладу: "${question}". Ответь ёмко, 1-2 абзаца, основываясь на картах из предыдущего расклада.`,
      uk: `Додаткове запитання користувача щодо цього розкладу: "${question}". Відповідай стисло, 1-2 абзаци, спираючись на карти з попереднього розкладу.`,
      en: `Follow-up question about this reading: "${question}". Reply concisely, 1-2 paragraphs, based on the cards from the previous reading.`,
    };

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'assistant' as const, content: reading.interpretation },
      { role: 'user' as const, content: followUpPrompts[locale] || followUpPrompts.ru },
    ];

    const answer = await callGrok(messages, 800);

    // Deduct mana
    await db.user.update({
      where: { id: user.id },
      data: { mana: { decrement: FOLLOWUP_COST } },
    });

    return NextResponse.json({ answer, newMana: user.mana - FOLLOWUP_COST });
  } catch (error: any) {
    console.error('Follow-up API error:', error);
    const message = error?.name?.startsWith('Grok')
      ? error.message
      : '🔮 Что-то пошло не так. Попробуй ещё раз через минуту!';
    const status = error?.name === 'GrokRateLimitError' ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
