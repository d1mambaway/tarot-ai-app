/**
 * Cloudflare Workers AI image generation (FLUX.2 [klein] 4B).
 * The FLUX.2 models take multipart/form-data and answer JSON with
 * result.image as base64. Keys: CF_ACCOUNT_ID, CF_API_TOKEN.
 */

export const CF_IMAGE_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';

export type CfImageResult =
  | { ok: true; base64: string; contentType: string }
  | { ok: false; stage: 'no_key' | 'cf_error' | 'cf_unexpected' | 'exception'; status?: number; detail?: unknown };

// PNG signature 89 50 4E 47; anything else is served as JPEG, as Cloudflare documents
export function detectImageType(buffer: Buffer): string {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  return 'image/jpeg';
}

export async function cfGenerateImage(
  prompt: string,
  { width, height, timeoutMs }: { width: number; height: number; timeoutMs: number },
): Promise<CfImageResult> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  if (!accountId || !apiToken) return { ok: false, stage: 'no_key' };

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(width));
  form.append('height', String(height));

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_IMAGE_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('application/json')) {
      const text = await res.text().catch(() => '');
      return { ok: false, stage: 'cf_unexpected', status: res.status, detail: { contentType, text: text.slice(0, 1000) } };
    }

    const data = (await res.json().catch(() => null)) as
      | { result?: { image?: string }; image?: string; success?: boolean; errors?: unknown }
      | null;
    const base64 = data?.result?.image || data?.image;
    if (!res.ok || !base64) return { ok: false, stage: 'cf_error', status: res.status, detail: data };

    return { ok: true, base64, contentType: detectImageType(Buffer.from(base64.slice(0, 16), 'base64')) };
  } catch (e) {
    const err = e as Error & { cause?: unknown };
    return {
      ok: false,
      stage: 'exception',
      detail: { error: String(e), message: err?.message, cause: err?.cause ? String(err.cause) : undefined },
    };
  }
}
