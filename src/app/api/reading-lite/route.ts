/**
 * POST /api/reading-lite — retired.
 *
 * It generated any reading (natal chart, matrix, Celtic cross…) without
 * charging anything, and the client fell back to it whenever /api/reading
 * returned an error — so any failure, or a hand-crafted request, meant a free
 * paid reading. /api/reading now refunds on failure, so there is nothing left
 * for a free fallback to do. Kept as a 410 so old cached clients get a clear
 * error instead of a 404.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: '🔮 Обнови приложение и попробуй ещё раз.' },
    { status: 410 },
  );
}
