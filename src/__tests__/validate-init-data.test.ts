/**
 * Tests for Telegram Mini App initData validation.
 *
 * validateInitData() verifies HMAC-SHA256 signature to ensure
 * the data really came from Telegram, not a spoofed request.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// We test validateInitData in isolation — no network, no DB.
// The function only uses crypto + BOT_TOKEN env var.

const FAKE_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

// Helper: build valid initData string with correct HMAC
function buildInitData(params: Record<string, string>, botToken: string): string {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const qs = new URLSearchParams(params);
  qs.set('hash', hash);
  return qs.toString();
}

describe('validateInitData', () => {
  let validateInitData: typeof import('@/lib/telegram').validateInitData;

  beforeEach(async () => {
    // Set env before importing the module
    vi.stubEnv('TELEGRAM_BOT_TOKEN', FAKE_BOT_TOKEN);
    // Re-import each time so the module picks up the token
    const mod = await import('@/lib/telegram');
    validateInitData = mod.validateInitData;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('accepts correctly signed data', () => {
    const user = JSON.stringify({ id: 12345, first_name: 'Test', username: 'test_user' });
    const initData = buildInitData(
      { user, auth_date: '1700000000', query_id: 'AAHQ' },
      FAKE_BOT_TOKEN,
    );

    const result = validateInitData(initData);

    expect(result.valid).toBe(true);
    expect(result.data.user).toBe(user);
    expect(result.data.auth_date).toBe('1700000000');
  });

  it('rejects tampered data (modified user)', () => {
    const user = JSON.stringify({ id: 12345, first_name: 'Test' });
    const initData = buildInitData(
      { user, auth_date: '1700000000' },
      FAKE_BOT_TOKEN,
    );

    // Tamper: change user id in the query string
    const tampered = initData.replace('12345', '99999');
    const result = validateInitData(tampered);

    expect(result.valid).toBe(false);
  });

  it('rejects data signed with a different bot token', () => {
    const user = JSON.stringify({ id: 12345, first_name: 'Test' });
    const initData = buildInitData(
      { user, auth_date: '1700000000' },
      '999999:WRONG-TOKEN',
    );

    const result = validateInitData(initData);

    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validateInitData('');
    expect(result.valid).toBe(false);
  });

  it('rejects data with missing hash', () => {
    const result = validateInitData('user=%7B%7D&auth_date=1700000000');
    expect(result.valid).toBe(false);
  });

  it('returns parsed data fields (excluding hash)', () => {
    const user = JSON.stringify({ id: 1 });
    const initData = buildInitData(
      { user, auth_date: '1700000000', query_id: 'XYZ' },
      FAKE_BOT_TOKEN,
    );

    const result = validateInitData(initData);

    expect(result.valid).toBe(true);
    expect(result.data).toHaveProperty('user');
    expect(result.data).toHaveProperty('auth_date');
    expect(result.data).toHaveProperty('query_id');
    expect(result.data).not.toHaveProperty('hash');
  });

  it('rejects a hash of the wrong length without throwing', () => {
    const initData = buildInitData({ auth_date: '1700000000', user: '{"id":1}' }, FAKE_BOT_TOKEN);
    const truncated = initData.replace(/hash=([a-f0-9]+)/, (_m, h) => `hash=${h.slice(0, 20)}`);
    expect(validateInitData(truncated).valid).toBe(false);
  });

  it('rejects a non-hex hash without throwing', () => {
    const initData = buildInitData({ auth_date: '1700000000', user: '{"id":1}' }, FAKE_BOT_TOKEN);
    const garbage = initData.replace(/hash=([a-f0-9]+)/, (_m, h) => `hash=${'z'.repeat(h.length)}`);
    expect(validateInitData(garbage).valid).toBe(false);
  });
});
