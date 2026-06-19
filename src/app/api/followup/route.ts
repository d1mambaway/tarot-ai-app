import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callGrok, buildTarotSystemPrompt } from '@/lib/grok';
import { validateInitData } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, readingId, question } = body;

    const { valid, data: tgData } = validateInitData(initData);
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = JSON.parse(tgData.user);
    const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check mana (follow-up costs 50 mana)
    const FOLLOWUP_COST = 50;
    if (user.mana < FOLLOWUP_COST) {
      return NextResponse.json({ error: 'Not enough mana', needsMana: true }, { status: 402 });
    }

    // Get original reading
    const reading = await db.reading.findUnique({ where: { id: readingId } });
    if (!reading || reading.userId !== user.id) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    const locale = user.locale as 'ru' | 'uk';
    const systemPrompt = buildTarotSystemPrompt(locale);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'assistant' as const, content: reading.interpretation },
      { role: 'user' as const, content: `Дополнительный вопрос пользователя по этому раскладу: "${question}". Ответь ёмко, 1-2 абзаца, основываясь на картах из предыдущего расклада.` },
    ];

    const answer = await callGrok(messages, 800);

    // Deduct mana
    await db.user.update({
      where: { id: user.id },
      data: { mana: { decrement: FOLLOWUP_COST } },
    });

    return NextResponse.json({ answer, newMana: user.mana - FOLLOWUP_COST });
  } catch (error) {
    console.error('Follow-up API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
