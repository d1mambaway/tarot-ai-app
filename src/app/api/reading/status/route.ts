/**
 * GET /api/reading/status?id=xxx&initData=yyy
 * Poll for async reading status (natal chart background generation).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInitData, parseUserFromInitData } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const readingId = searchParams.get('id');
  const initData = searchParams.get('initData') || '';

  if (!readingId) {
    return NextResponse.json({ error: 'Missing reading id' }, { status: 400 });
  }

  // Validate Telegram auth
  if (!validateInitData(initData)) {
    return NextResponse.json({ error: 'Invalid auth' }, { status: 401 });
  }

  const tgUser = parseUserFromInitData(initData);
  if (!tgUser) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
  }

  const reading = await db.reading.findFirst({
    where: {
      id: readingId,
      user: { telegramId: BigInt(tgUser.id) },
    },
    select: {
      id: true,
      status: true,
      interpretation: true,
      cards: true,
      type: true,
    },
  });

  if (!reading) {
    return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: reading.id,
    status: reading.status,
    // Only include interpretation when complete
    ...(reading.status === 'complete' && {
      interpretation: reading.interpretation,
      cards: reading.cards,
    }),
  });
}
