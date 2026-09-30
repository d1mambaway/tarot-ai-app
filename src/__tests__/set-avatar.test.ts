import { afterEach, describe, expect, it, vi } from 'vitest';
import { setMyAnimatedProfilePhoto } from '@/lib/telegram';

describe('setMyAnimatedProfilePhoto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uploads the video as attach://avatar with an animated InputProfilePhoto', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, result: true })));
    vi.stubGlobal('fetch', fetchMock);

    const res = await setMyAnimatedProfilePhoto(Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]));

    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/setMyProfilePhoto$/);
    const form = init.body as FormData;
    expect(JSON.parse(form.get('photo') as string)).toEqual({ type: 'animated', animation: 'attach://avatar', main_frame_timestamp: 0 });
    const avatar = form.get('avatar') as File;
    expect(avatar.name).toBe('avatar.mp4');
    expect(avatar.size).toBe(8);
  });
});
