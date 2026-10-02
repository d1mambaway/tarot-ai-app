import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => { process.env.TELEGRAM_BOT_TOKEN = '123456:TEST-TOKEN'; });

import { appInitData, appUserId, isAppUserId, DEVICE_KEY_RE } from '@/lib/app-session';
import { authenticateRequest } from '@/lib/auth';
import { validateInitData } from '@/lib/telegram';

const KEY = 'a'.repeat(20) + 'B_c-' + 'z9'.repeat(10);

describe('app sessions', () => {
  it('signs initData that the Telegram check accepts', () => {
    const { initData, userId } = appInitData(KEY, { name: 'Аня', lang: 'uk' });
    expect(validateInitData(initData).valid).toBe(true);
    const auth = authenticateRequest(initData);
    expect('user' in auth && auth.user.id).toBe(userId);
    expect(JSON.parse(validateInitData(initData).data.user).first_name).toBe('Аня');
  });

  it('rejects a tampered session', () => {
    const { initData } = appInitData(KEY);
    const forged = initData.replace(/user=[^&]+/, `user=${encodeURIComponent(JSON.stringify({ id: 42, first_name: 'x' }))}`);
    expect(validateInitData(forged).valid).toBe(false);
  });

  it('gives a stable negative id per device', () => {
    expect(appUserId(KEY)).toBe(appUserId(KEY));
    expect(appUserId(KEY)).toBeLessThan(0);
    expect(Number.isSafeInteger(appUserId(KEY))).toBe(true);
    expect(appUserId(KEY)).not.toBe(appUserId(KEY + 'x'));
    expect(isAppUserId(appUserId(KEY))).toBe(true);
    expect(isAppUserId(123456789)).toBe(false);
  });

  it('accepts only long random-looking device keys', () => {
    expect(DEVICE_KEY_RE.test(KEY)).toBe(true);
    expect(DEVICE_KEY_RE.test('short')).toBe(false);
    expect(DEVICE_KEY_RE.test('x'.repeat(40) + '<')).toBe(false);
  });
});
