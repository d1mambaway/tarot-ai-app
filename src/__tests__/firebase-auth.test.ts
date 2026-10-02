import crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyFirebaseIdToken, FIREBASE_PROJECT_ID } from '@/lib/firebase-auth';
import { appAccountId, appUserId } from '@/lib/app-session';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...(publicKey.export({ format: 'jwk' }) as object), kid: 'k1', alg: 'RS256', use: 'sig' };
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);

function token(payload: Record<string, unknown>, kid = 'k1', key = privateKey) {
  const head = b64({ alg: 'RS256', kid, typ: 'JWT' });
  const body = b64(payload);
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), key).toString('base64url');
  return `${head}.${body}.${sig}`;
}
const good = {
  aud: FIREBASE_PROJECT_ID, iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
  sub: 'uid-123', iat: now - 10, exp: now + 3600, email: 'a@b.c', name: 'Аня',
  firebase: { sign_in_provider: 'google.com' },
};

describe('verifyFirebaseIdToken', () => {
  afterEach(() => vi.unstubAllGlobals());
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }))));

  it('accepts a valid token', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }))));
    expect(await verifyFirebaseIdToken(token(good))).toEqual({ uid: 'uid-123', email: 'a@b.c', name: 'Аня', provider: 'google.com' });
  });

  it('rejects other projects, expired tokens and forged signatures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] }))));
    expect(await verifyFirebaseIdToken(token({ ...good, aud: 'other' }))).toBeNull();
    expect(await verifyFirebaseIdToken(token({ ...good, exp: now - 5 }))).toBeNull();
    const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    expect(await verifyFirebaseIdToken(token(good, 'k1', other))).toBeNull();
    expect(await verifyFirebaseIdToken('not.a.jwt')).toBeNull();
  });

  it('gives accounts ids separate from device ids', () => {
    expect(appAccountId('uid-123')).toBeLessThan(0);
    expect(appAccountId('uid-123')).toBe(appAccountId('uid-123'));
    expect(appAccountId('uid-123')).not.toBe(appUserId('uid-123'.padEnd(40, 'x')));
  });
});
