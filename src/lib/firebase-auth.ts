/**
 * Verifies Firebase Authentication ID tokens (the Android app's Google and
 * email sign-in) without the Admin SDK: an RS256 JWT checked against
 * Google's published keys, issuer and audience of our Firebase project.
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */

import crypto from 'crypto';

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'magic-of-cards';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export interface FirebaseIdentity {
  uid: string;
  email?: string;
  name?: string;
  provider?: string;
}

type Jwk = crypto.JsonWebKey & { kid: string };
let keys: { at: number; byKid: Map<string, crypto.KeyObject> } | null = null;

async function publicKey(kid: string): Promise<crypto.KeyObject | undefined> {
  if (!keys || Date.now() - keys.at > 3600_000 || !keys.byKid.has(kid)) {
    const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`JWKS ${res.status}`);
    const { keys: list } = (await res.json()) as { keys: Jwk[] };
    keys = { at: Date.now(), byKid: new Map(list.map((k) => [k.kid, crypto.createPublicKey({ key: k, format: 'jwk' })])) };
  }
  return keys.byKid.get(kid);
}

const b64json = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

/** The identity in a valid token, or null for anything that does not check out */
export async function verifyFirebaseIdToken(token: string, now: number = Date.now()): Promise<FirebaseIdentity | null> {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) return null;
  let header: { alg?: string; kid?: string };
  let p: Record<string, unknown>;
  try {
    header = b64json(parts[0]);
    p = b64json(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;

  const key = await publicKey(header.kid);
  if (!key) return null;
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'));
  if (!ok) return null;

  const t = Math.floor(now / 1000);
  if (p.aud !== FIREBASE_PROJECT_ID) return null;
  if (p.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
  if (typeof p.exp !== 'number' || p.exp <= t) return null;
  if (typeof p.iat !== 'number' || p.iat > t + 60) return null;
  if (typeof p.sub !== 'string' || !p.sub || p.sub.length > 128) return null;

  const firebase = (p.firebase || {}) as { sign_in_provider?: string };
  return {
    uid: p.sub,
    email: typeof p.email === 'string' ? p.email : undefined,
    name: typeof p.name === 'string' ? p.name : undefined,
    provider: firebase.sign_in_provider,
  };
}
