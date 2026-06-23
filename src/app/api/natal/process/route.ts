/**
 * POST /api/natal/process
 *
 * Internal endpoint that processes ONE step of the natal chart pipeline.
 * After completing a step, it chains to itself for the next step.
 *
 * This avoids Vercel's serverless timeout — each step is a separate
 * function invocation (~30-60s each), rather than one 5+ minute call.
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processNatalStep } from '@/lib/natal-multi-step';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Verify internal secret
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { readingId, step } = body;

    if (!readingId || typeof step !== 'number') {
      return NextResponse.json({ error: 'Missing readingId or step' }, { status: 400 });
    }

    const result = await processNatalStep(readingId, step);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[natal/process] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
