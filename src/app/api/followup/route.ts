import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { callGrok, buildTarotSystemPrompt, buildUserMemoryContext } from '@/lib/ai';
import { validateInitData } from '@/lib/telegram';

// Base mana cost of the FIRST follow-up question on a reading.
// Every next follow-up on the SAME reading doubles: 1st = BASE, 2nd = BASE*2,
// 3rd = BASE*4, etc. Applies to everyone, premium included — deepening the
// conversation is a deliberate "spend more to go deeper" moment, not a flat fee.
const FOLLOWUP_BASE_COST = 100;

function followupCost(previousFollowupCount: number): number {
  return FOLLOWUP_BASE_COST * Math.pow(2, previousFollowupCount);
}

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

    // Get original reading
    const reading = await db.reading.findUnique({ where: { id: readingId } });
    if (!reading || reading.userId !== user.id) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    // Progressive pricing: cost doubles with each follow-up on this same reading.
    // Applies to everyone, including premium/VIP — there is no free follow-up tier.
    const cost = followupCost(reading.followupCount);

    if (user.mana < cost) {
      return NextResponse.json({ error: 'Not enough mana', needsMana: true, cost }, { status: 402 });
    }

    const locale = (user.locale as 'ru' | 'uk' | 'en') || 'ru';
    const memoryContext = await buildUserMemoryContext(user.id, locale, { excludeReadingId: reading.id });
    const systemPrompt = buildTarotSystemPrompt(locale, memoryContext);

    const followUpPrompts: Record<string, string> = {
      ru: `Дополнительный вопрос пользователя по этому раскладу (уточнение №${reading.followupCount + 1}): "${question}". Ответь ёмко, 1-2 абзаца, основываясь на картах из предыдущего расклада. Не повторяй формулировки из своего же предыдущего ответа — раскрой именно новый угол, который спрашивают сейчас.`,
      uk: `Додаткове запитання користувача щодо цього розкладу (уточнення №${reading.followupCount + 1}): "${question}". Відповідай стисло, 1-2 абзаци, спираючись на карти з попереднього розкладу. Не повторюй формулювання з попередньої відповіді.`,
      en: `Follow-up question about this reading (clarification #${reading.followupCount + 1}): "${question}". Reply concisely, 1-2 paragraphs, based on the cards from the previous reading. Do not repeat phrasing from your previous answer — address the specific new angle being asked now.`,
    };

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'assistant' as const, content: reading.interpretation },
      { role: 'user' as const, content: followUpPrompts[locale] || followUpPrompts.ru },
    ];

    const answer = await callGrok(messages, 800);

    // Deduct mana ATOMICALLY (guards against parallel requests draining below 0)
    // and bump the follow-up count for the NEXT question's price.
    const charged = await db.user.updateMany({
      where: { id: user.id, mana: { gte: cost } },
      data: { mana: { decrement: cost } },
    });
    if (charged.count !== 1) {
      return NextResponse.json({ error: 'Not enough mana', needsMana: true, cost }, { status: 402 });
    }

    const [updatedUser] = await db.$transaction([
      db.user.findUniqueOrThrow({ where: { id: user.id } }),
      db.reading.update({
        where: { id: reading.id },
        data: { followupCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      answer,
      newMana: updatedUser.mana,
      cost,
      nextCost: followupCost(reading.followupCount + 1),
      followupCount: reading.followupCount + 1,
    });
  } catch (error: any) {
    console.error('Follow-up API error:', error);
    const message = error?.name?.startsWith('Grok')
      ? error.message
      : '🔮 Что-то пошло не так. Попробуй ещё раз через минуту!';
    const status = error?.name === 'GrokRateLimitError' ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
