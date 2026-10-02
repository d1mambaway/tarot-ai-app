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

async function session(): Promise<string> {
  try {
    const cached = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (cached?.initData && Date.now() - cached.at < REFRESH_MS) return cached.initData;
  } catch { /* fetch a new one */ }
  const res = await fetch('/api/app/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceKey: deviceKey(), lang: deviceLang() }),
  });
  if (!res.ok) throw new Error(`session ${res.status}`);
  const { initData } = await res.json();
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ initData, at: Date.now() })); } catch { /* ok */ }
  return initData;
}

function vibrate(ms: number) {
  const haptics = cap()?.Plugins?.Haptics;
  if (haptics?.impact) haptics.impact({ style: ms > 20 ? 'MEDIUM' : 'LIGHT' }).catch(() => {});
  else navigator.vibrate?.(ms);
}

function openExternal(url: string) {
  const browser = cap()?.Plugins?.Browser;
  if (browser?.open) browser.open({ url }).catch(() => window.open(url, '_blank'));
  else window.open(url, '_blank');
}

/** t.me/share/url?url=…&text=… → the system share sheet */
function shareOrOpen(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === 't.me' && u.pathname.startsWith('/share')) {
      const text = [u.searchParams.get('text'), u.searchParams.get('url')].filter(Boolean).join('\n');
      const share = cap()?.Plugins?.Share;
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
  cap()?.Plugins?.App?.addListener?.('backButton', () => {
    if (backVisible && backHandlers.size) backHandlers.forEach((fn) => fn());
    else cap()?.Plugins?.App?.minimizeApp?.();
  });

  const noop = () => {};
  (window as any).Telegram = {
    WebApp: {
      platform: 'android_app',
      initData,
      initDataUnsafe: { user, auth_date: params.get('auth_date') },
      ready: noop,
      expand: noop,
      close: () => cap()?.Plugins?.App?.minimizeApp?.(),
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
