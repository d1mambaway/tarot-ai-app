/**
 * GET /api/reading/status?id=xxx&initData=yyy
 * Poll for async reading status (natal chart background generation).
 *
 * Also acts as a RECOVERY mechanism: if the reading is stuck (pending but
 * no progress for 90+ seconds), it re-triggers the pipeline step.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseUserFromInitData } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const readingId = searchParams.get('id');
  const initData = searchParams.get('initData') || '';

  if (!readingId) {
    return NextResponse.json({ error: 'Missing reading id' }, { status: 400 });
  }

  const tgUser = parseUserFromInitData(initData);
  if (!tgUser) {
    return NextResponse.json({ error: 'Invalid auth' }, { status: 401 });
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
      generatedImage: true,
      natalStep: true,
      natalLastAttempt: true,
      createdAt: true,
    },
  });

  if (!reading) {
    return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
  }

  // Recovery: if reading is pending and stuck for >90s, re-trigger the step
  if (reading.status === 'pending') {
    const lastActivity = reading.natalLastAttempt || reading.createdAt;
    const stuckMs = Date.now() - lastActivity.getTime();
    const nextStep = (reading.natalStep || 0) + 1;

    if (stuckMs > 90_000 && nextStep <= 5) {
      console.log(`[natal/status] Reading ${readingId} stuck at step ${reading.natalStep} for ${Math.round(stuckMs / 1000)}s — re-triggering step ${nextStep}`);

      // Mark this attempt so we don't spam retries every 5s
      await db.reading.update({
        where: { id: readingId },
        data: { natalLastAttempt: new Date() },
      });

      // Fire recovery chain
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;
      const secret = process.env.CRON_SECRET || '';

      fetch(`${baseUrl}/api/natal/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ readingId, step: nextStep }),
      }).catch((err) => {
        console.error('[natal/status] Recovery chain error:', err);
      });
    }
  }

  return NextResponse.json({
    id: reading.id,
    status: reading.status,
    ...(reading.status === 'pending'
      ? { natalStep: reading.natalStep || 0, totalSteps: 5 }
      : {}),
    ...(reading.status === 'complete' || reading.status === 'failed'
      ? {
          interpretation: reading.interpretation,
          cards: reading.cards,
          generatedImage: reading.generatedImage || null,
        }
      : {}),
  });
}
