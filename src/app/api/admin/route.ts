/**
 * Admin API — list users, grant mana, view stats
 * Auth: validates Telegram initData OR checks ADMIN_SECRET + isAdmin flag in DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInitData } from '@/lib/telegram';

// Hardcoded admin usernames as fallback
const ADMIN_USERNAMES = ['d1mamba'];

// Shared secret for web admin panel (set in .env)
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

async function getAdminUser(req: NextRequest) {
  const url = new URL(req.url);

  // Method 1: Telegram initData (from Mini App)
  const initData = url.searchParams.get('initData') || '';
  if (initData) {
    const { valid, data } = validateInitData(initData);
    if (!valid) return null;
    try {
      const tgUser = JSON.parse(data.user);
      const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
      if (user?.isAdmin) return user;
      if (ADMIN_USERNAMES.includes(tgUser.username?.toLowerCase())) return user || { id: 'fallback', isAdmin: true };
    } catch (e) {
      console.warn('Admin initData auth error:', e);
      return null;
    }
  }

  // Method 2: ADMIN_SECRET + Telegram ID (for web admin panel)
  const secret = req.headers.get('x-admin-secret') || '';
  const adminTgId = req.headers.get('x-admin-tg-id') || '';
  if (adminTgId && secret && ADMIN_SECRET && secret === ADMIN_SECRET) {
    try {
      const user = await db.user.findUnique({ where: { telegramId: BigInt(adminTgId) } });
      if (user?.isAdmin) return user;
    } catch (e) {
      console.warn('Admin secret auth error:', e);
      return null;
    }
  }

  return null;
}

// GET /api/admin — list users + stats
export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search') || '';

  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total, totalMana, totalPayments] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        locale: true,
        mana: true,
        isAdmin: true,
        channelSubBonus: true,
        streakDays: true,
        createdAt: true,
        _count: { select: { readings: true, payments: true } },
      },
    }),
    db.user.count({ where }),
    db.user.aggregate({ _sum: { mana: true } }),
    db.payment.aggregate({ _sum: { starsAmount: true }, _count: true }),
  ]);

  // BigInt serialization fix
  const serializedUsers = users.map((u) => ({
    ...u,
    telegramId: u.telegramId.toString(),
  }));

  return NextResponse.json({
    users: serializedUsers,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats: {
      totalUsers: total,
      totalMana: totalMana._sum.mana || 0,
      totalStarsRevenue: totalPayments._sum.starsAmount || 0,
      totalPayments: totalPayments._count || 0,
    },
  });
}

// POST /api/admin — actions (grant mana, toggle admin, etc.)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, initData, adminTgId, adminSecret } = body;

  // Auth: require either valid initData or ADMIN_SECRET + TG ID
  let isAuthed = false;

  if (initData) {
    const { valid, data } = validateInitData(initData);
    if (valid) {
      try {
        const tgUser = JSON.parse(data.user);
        const user = await db.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });
        if (user?.isAdmin || ADMIN_USERNAMES.includes(tgUser.username?.toLowerCase())) {
          isAuthed = true;
        }
      } catch { /* invalid user data */ }
    }
  }

  if (!isAuthed && adminTgId && adminSecret && ADMIN_SECRET && adminSecret === ADMIN_SECRET) {
    try {
      const user = await db.user.findUnique({ where: { telegramId: BigInt(adminTgId) } });
      if (user?.isAdmin) isAuthed = true;
    } catch { /* invalid tg id */ }
  }

  if (!isAuthed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (action === 'grant_mana') {
    const { targetTgId, amount } = body;
    if (!targetTgId || !amount) return NextResponse.json({ error: 'Missing targetTgId or amount' }, { status: 400 });

    const user = await db.user.update({
      where: { telegramId: BigInt(targetTgId) },
      data: { mana: { increment: amount } },
    });

    return NextResponse.json({
      ok: true,
      user: { ...user, telegramId: user.telegramId.toString() },
    });
  }

  if (action === 'set_admin') {
    const { targetTgId, isAdmin } = body;
    const user = await db.user.update({
      where: { telegramId: BigInt(targetTgId) },
      data: { isAdmin: !!isAdmin },
    });
    return NextResponse.json({
      ok: true,
      user: { ...user, telegramId: user.telegramId.toString() },
    });
  }

  if (action === 'set_mana') {
    const { targetTgId, amount } = body;
    const user = await db.user.update({
      where: { telegramId: BigInt(targetTgId) },
      data: { mana: amount },
    });
    return NextResponse.json({
      ok: true,
      user: { ...user, telegramId: user.telegramId.toString() },
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
