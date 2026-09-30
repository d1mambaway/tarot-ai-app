import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => { process.env.NEXT_PUBLIC_APP_URL = 'https://app.test'; });

const users = [
  { telegramId: BigInt(1), locale: 'ru' },
  { telegramId: BigInt(2), locale: 'uk' },
  { telegramId: BigInt(3), locale: 'en' },
];
const settings = new Map<string, string>();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      updateMany: vi.fn(async () => ({ count: 0 })),
      findMany: vi.fn(async () => users),
    },
  },
}));
vi.mock('@/lib/secrets', () => ({ cronAuthorized: () => true }));
vi.mock('@/lib/ai', () => ({ collectDueReminders: vi.fn(async () => []), markReminderSent: vi.fn() }));
vi.mock('@/lib/admin-settings', () => ({
  getSetting: vi.fn(async (k: string) => settings.get(k) ?? null),
  setSetting: vi.fn(async (k: string, v: string) => { settings.set(k, v); }),
}));
const sendAnimation = vi.fn();
const sendMessage = vi.fn();
vi.mock('@/lib/telegram', () => ({
  sendAnimation: (...a: unknown[]) => sendAnimation(...a),
  sendMessage: (...a: unknown[]) => sendMessage(...a),
  tgApi: vi.fn(async () => ({ ok: true })),
}));

async function runCron() {
  const { GET } = await import('@/app/api/cron/route');
  const res = await GET(new Request('https://x/api/cron') as never);
  return res.json();
}

describe('cron: card of the day animation', () => {
  beforeEach(() => {
    settings.clear();
    sendAnimation.mockReset();
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ ok: true });
  });

  it('uploads by URL once, then sends everyone the file_id and stores it', async () => {
    sendAnimation.mockImplementation(async (_chat: string, anim: string) => ({
      ok: true,
      result: { animation: { file_id: anim.startsWith('http') ? 'FID1' : anim } },
    }));

    const out = await runCron();

    expect(out.sent).toBe(3);
    expect(sendAnimation.mock.calls[0][1]).toBe('https://app.test/ui/card-of-day.mp4');
    expect(sendAnimation.mock.calls[1][1]).toBe('FID1');
    expect(sendAnimation.mock.calls[2][1]).toBe('FID1');
    expect(settings.get('cotd_animation_file_id')).toBe('FID1');
    expect(sendAnimation.mock.calls[0][2]).toContain('Что скрывает твоя карта дня?');
    expect(sendAnimation.mock.calls[1][3].reply_markup.inline_keyboard[0][0].text).toBe('🪄 Перевернути карту');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('starts from the stored file_id on later days', async () => {
    settings.set('cotd_animation_file_id', 'OLD');
    sendAnimation.mockResolvedValue({ ok: true, result: { animation: { file_id: 'OLD' } } });

    await runCron();

    expect(sendAnimation.mock.calls.every((c) => c[1] === 'OLD')).toBe(true);
  });

  it('falls back to text when the animation fails, but not for a blocked bot', async () => {
    sendAnimation
      .mockResolvedValueOnce({ ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' })
      .mockResolvedValue({ ok: false, error_code: 400, description: 'Bad Request: failed to get HTTP URL content' });

    const out = await runCron();

    expect(sendMessage).toHaveBeenCalledTimes(2); // users 2 and 3 get text
    expect(sendMessage.mock.calls[0][1]).toContain('Що приховує твоя карта дня?');
    expect(out.sent).toBe(2);
    expect(out.failed).toBe(1);
  });
});
