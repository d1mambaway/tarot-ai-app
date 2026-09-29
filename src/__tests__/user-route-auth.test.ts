import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

const TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
const findUnique = vi.fn();
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));
vi.mock('@/lib/user-limits', () => ({ updateStreak: vi.fn(), processReferral: vi.fn() }));
vi.mock('@/lib/premium', () => ({ checkPremium: vi.fn() }));

function signed(params: Record<string, string>) {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const dcs = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const key = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest();
  const qs = new URLSearchParams(params);
  qs.set('hash', crypto.createHmac('sha256', key).update(dcs).digest('hex'));
  return qs.toString();
}

async function call(body: unknown) {
  const { POST } = await import('@/app/api/user/route');
  const { NextRequest } = await import('next/server');
  return POST(new NextRequest('http://x/api/user', { method: 'POST', body: JSON.stringify(body) }));
}

describe('/api/user auth', () => {
  beforeEach(() => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', TOKEN);
    findUnique.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('rejects a bare telegramId without initData', async () => {
    const res = await call({ telegramId: 42 });
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects forged initData', async () => {
    const res = await call({ initData: 'user=%7B%22id%22%3A42%7D&auth_date=1&hash=deadbeef', telegramId: 42 });
    expect(res.status).toBe(401);
  });

  it('rejects stale initData (older than a day)', async () => {
    const old = String(Math.floor(Date.now() / 1000) - 2 * 86400);
    const res = await call({ initData: signed({ user: JSON.stringify({ id: 42 }), auth_date: old }) });
    expect(res.status).toBe(401);
  });

  it('uses the signed id, not the one from the body', async () => {
    findUnique.mockRejectedValueOnce(new Error('stop here'));
    const now = String(Math.floor(Date.now() / 1000));
    await call({ initData: signed({ user: JSON.stringify({ id: 42 }), auth_date: now }), telegramId: 999 });
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(findUnique.mock.calls[0][0].where.telegramId).toBe(BigInt(42));
  });
});
