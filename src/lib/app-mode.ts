/**
 * Standalone app mode (the Android app, android-app/): the same web app runs
 * without Telegram. setupAppMode() signs the device in (/api/app/session)
 * and puts a small stand-in for window.Telegram.WebApp in place, so the rest
 * of the code — which talks to Telegram.WebApp — keeps working:
 *
 * - initData / initDataUnsafe: the server-signed session
 * - BackButton: the Android back button (Capacitor App plugin)
 * - HapticFeedback: vibration
 * - openTelegramLink / openLink: share sheet for t.me/share links, the
 *   browser for everything else
 * - openInvoice: purchases are not in the app yet, a polite message instead
 *
 * In Telegram nothing here runs.
 */

import { useEffect, useState } from 'react';

type L = 'ru' | 'uk' | 'en';

const DEVICE_KEY = 'mk_device_key';
const SESSION_KEY = 'mk_app_session';
const APP_FLAG = 'mk_app_mode';
const ACCOUNT_KEY = 'mk_account'; // { email, name } once signed in with Google / email
const AUTH_SKIPPED = 'mk_auth_skipped';
const REFRESH_MS = 12 * 3600 * 1000; // sessions are valid 24 h

const T = {
  noPay: {
    ru: 'Покупки в приложении скоро появятся. А пока расклады доступны за оракулы на балансе ✨',
    uk: 'Покупки в застосунку скоро з’являться. А поки розклади доступні за оракули на балансі ✨',
    en: 'In-app purchases are coming soon. For now, readings use the oracles on your balance ✨',
  },
};

function cap(): any {
  return typeof window !== 'undefined' ? (window as any).Capacitor : undefined;
}

/** A native plugin by name: the bridge's proxy, or one registered on the spot */
function plugin(name: string): any {
  const c = cap();
  if (!c) return undefined;
  if (c.Plugins?.[name]) return c.Plugins[name];
  if (!c.isPluginAvailable?.(name) || !c.registerPlugin) return undefined;
  try { return c.registerPlugin(name); } catch { return undefined; }
}

/** Running inside the Android app */
export function isAppMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).get('app') === 'android') localStorage.setItem(APP_FLAG, '1');
  } catch { /* storage may be blocked */ }
  if (cap()?.isNativePlatform?.()) return true;
  try {
    return localStorage.getItem(APP_FLAG) === '1';
  } catch {
    return false;
  }
}

function deviceKey(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY);
    if (saved && /^[A-Za-z0-9_-]{32,128}$/.test(saved)) return saved;
  } catch { /* fall through */ }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const key = btoa(String.fromCharCode(...Array.from(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  try { localStorage.setItem(DEVICE_KEY, key); } catch { /* the session lives in memory then */ }
  return key;
}

function deviceLang(): L {
  const l = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return l === 'uk' ? 'uk' : l === 'en' ? 'en' : 'ru';
}

// ─── Account (Firebase Authentication, native plugin) ──────────────────────

export interface AppAccount { email: string | null; name: string | null }

function auth(): any {
  const p = plugin('FirebaseAuthentication');
  if (!p) throw new Error('plugin-missing');
  return p;
}

function authOrNull(): any {
  try { return auth(); } catch { return undefined; }
}

export function getAccount(): AppAccount | null {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null'); } catch { return null; }
}

/** Sign-in screen should show: in the app, not signed in, not skipped */
export function shouldOfferSignIn(): boolean {
  if (!isAppMode() || getAccount()) return false;
  try { return localStorage.getItem(AUTH_SKIPPED) !== '1'; } catch { return true; }
}

export function skipSignIn() {
  try { localStorage.setItem(AUTH_SKIPPED, '1'); } catch { /* ok */ }
}

/** Exchange the current Firebase user's ID token for our session */
async function accountSession(): Promise<string | null> {
  const fb = authOrNull();
  if (!fb) return null;
  const { token } = await fb.getIdToken({ forceRefresh: false }).catch(() => ({ token: null }));
  if (!token) return null;
  const res = await fetch('/api/app/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token, deviceKey: deviceKey(), lang: deviceLang() }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ email: data.email, name: data.name })); } catch { /* ok */ }
  return data.initData;
}

async function deviceSession(): Promise<string> {
  const res = await fetch('/api/app/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceKey: deviceKey(), lang: deviceLang() }),
  });
  if (!res.ok) throw new Error(`session ${res.status}`);
  return (await res.json()).initData;
}

async function session(): Promise<string> {
  try {
    const cached = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (cached?.initData && Date.now() - cached.at < REFRESH_MS) return cached.initData;
  } catch { /* fetch a new one */ }
  const initData = (getAccount() && (await accountSession())) || (await deviceSession());
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ initData, at: Date.now() })); } catch { /* ok */ }
  return initData;
}

/** After signing in or out: drop the cached session and start over */
function restart() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ok */ }
  window.location.reload();
}

async function finishSignIn() {
  const { token } = await auth().getIdToken({ forceRefresh: false }).catch((e: any) => {
    throw new Error(`token: ${e?.message || e}`);
  });
  if (!token) throw new Error('token: empty');
  const res = await fetch('/api/app/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token, deviceKey: deviceKey(), lang: deviceLang() }),
  });
  if (!res.ok) throw new Error(`server login ${res.status}`);
  const data = await res.json();
  try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ email: data.email, name: data.name })); } catch { /* ok */ }
  const initData = data.initData;
  if (!initData) throw new Error('server login: no session');
  restart();
}

export async function signInWithGoogle() {
  await auth().signInWithGoogle();
  await finishSignIn();
}

export async function signInWithEmail(email: string, password: string) {
  await auth().signInWithEmailAndPassword({ email, password });
  await finishSignIn();
}

export async function signUpWithEmail(email: string, password: string) {
  await auth().createUserWithEmailAndPassword({ email, password });
  await finishSignIn();
}

export async function resetPassword(email: string) {
  await auth().sendPasswordResetEmail({ email });
}

export async function signOut() {
  await authOrNull()?.signOut().catch(() => {});
  try { localStorage.removeItem(ACCOUNT_KEY); } catch { /* ok */ }
  restart();
}

/** Delete the account and its data, then start fresh as a new guest */
export async function deleteAccount(initData: string) {
  const res = await fetch('/api/app/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) throw new Error('delete');
  await authOrNull()?.deleteUser().catch(() => authOrNull()?.signOut().catch(() => {}));
  try {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(DEVICE_KEY); // a new guest identity too
  } catch { /* ok */ }
  restart();
}

function vibrate(ms: number) {
  const haptics = plugin('Haptics');
  if (haptics?.impact) haptics.impact({ style: ms > 20 ? 'MEDIUM' : 'LIGHT' }).catch(() => {});
  else navigator.vibrate?.(ms);
}

function openExternal(url: string) {
  const browser = plugin('Browser');
  if (browser?.open) browser.open({ url }).catch(() => window.open(url, '_blank'));
  else window.open(url, '_blank');
}

/** t.me/share/url?url=…&text=… → the system share sheet */
function shareOrOpen(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === 't.me' && u.pathname.startsWith('/share')) {
      const text = [u.searchParams.get('text'), u.searchParams.get('url')].filter(Boolean).join('\n');
      const share = plugin('Share');
      if (share?.share) { share.share({ text }).catch(() => {}); return; }
      if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
    }
  } catch { /* not a URL we know */ }
  openExternal(url);
}

/**
 * Sign in and install the Telegram.WebApp stand-in. Call before the app
 * reads Telegram.WebApp. Returns false outside app mode.
 */
export async function setupAppMode(): Promise<boolean> {
  if (!isAppMode()) return false;
  const initData = await session();
  const params = new URLSearchParams(initData);
  const user = JSON.parse(params.get('user') || '{}');
  const lang = (user.language_code || 'ru') as L;

  // Android back button → the screen's back handler; on the home screen it leaves the app
  const backHandlers = new Set<() => void>();
  let backVisible = false;
  plugin('App')?.addListener?.('backButton', () => {
    if (backVisible && backHandlers.size) backHandlers.forEach((fn) => fn());
    else plugin('App')?.minimizeApp?.();
  });

  const noop = () => {};
  (window as any).Telegram = {
    WebApp: {
      platform: 'android_app',
      initData,
      initDataUnsafe: { user, auth_date: params.get('auth_date') },
      ready: noop,
      expand: noop,
      close: () => plugin('App')?.minimizeApp?.(),
      setHeaderColor: noop,
      setBackgroundColor: noop,
      disableVerticalSwipes: noop,
      enableClosingConfirmation: noop,
      disableClosingConfirmation: noop,
      BackButton: {
        show: () => { backVisible = true; },
        hide: () => { backVisible = false; },
        onClick: (fn: () => void) => backHandlers.add(fn),
        offClick: (fn: () => void) => backHandlers.delete(fn),
      },
      HapticFeedback: {
        impactOccurred: (s: string) => vibrate(s === 'heavy' ? 30 : s === 'medium' ? 20 : 10),
        notificationOccurred: () => vibrate(25),
        selectionChanged: () => vibrate(8),
      },
      showAlert: (msg: string, cb?: () => void) => { window.alert(msg); cb?.(); },
      openLink: (url: string) => openExternal(url),
      openTelegramLink: (url: string) => shareOrOpen(url),
      openInvoice: (_url: string, cb?: (status: string) => void) => {
        window.alert(T.noPay[lang] || T.noPay.ru);
        cb?.('cancelled');
      },
    },
  };
  return true;
}

/** React: true inside the Android app (false during server render) */
export function useAppMode(): boolean {
  const [app, setApp] = useState(false);
  useEffect(() => setApp(isAppMode()), []);
  return app;
}
