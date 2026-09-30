import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateImage } from '@/lib/ai/image';
import { CF_IMAGE_MODEL } from '@/lib/ai/cloudflare-image';

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');

describe('generateImage (Cloudflare Workers AI)', () => {
  beforeEach(() => {
    vi.stubEnv('CF_ACCOUNT_ID', 'acc123');
    vi.stubEnv('CF_API_TOKEN', 'tok456');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('posts multipart prompt/width/height to flux-2-klein-4b and returns a data URL', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, result: { image: PNG_B64 } }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const url = await generateImage('a lantern in the dark');

    expect(url).toBe(`data:image/png;base64,${PNG_B64}`);
    const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe(`https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/${CF_IMAGE_MODEL}`);
    expect(CF_IMAGE_MODEL).toBe('@cf/black-forest-labs/flux-2-klein-4b');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok456');
    const form = init.body as FormData;
    expect(form.get('prompt')).toBe('a lantern in the dark');
    expect(form.get('width')).toBe('768');
    expect(form.get('height')).toBe('512');
  });

  it('returns null on an error answer or without keys', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ success: false, errors: [{ message: 'quota' }] }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }),
    ));
    expect(await generateImage('x')).toBeNull();

    vi.stubEnv('CF_API_TOKEN', '');
    expect(await generateImage('x')).toBeNull();
  });
});
