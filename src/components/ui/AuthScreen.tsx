'use client';

/**
 * Sign-in for the Android app: Google, email + password (sign in, create an
 * account, reset the password) or carry on without an account. Shown on
 * launch until the person signs in or skips; the profile can open it again
 * ("mk-open-auth" event). Not used inside Telegram.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import { Icon, Spinner } from './Icon';
import {
  resetPassword, shouldOfferSignIn, signInWithEmail, signInWithGoogle, signUpWithEmail, skipSignIn, useAppMode,
} from '@/lib/app-mode';
import { useAppStore } from '@/store/app-store';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Магия Карт', uk: 'Магія Карт', en: 'Magic of Cards' },
  sub: {
    ru: 'Войди, чтобы баланс, расклады и коллекция были с тобой на любом телефоне',
    uk: 'Увійди, щоб баланс, розклади й колекція були з тобою на будь-якому телефоні',
    en: 'Sign in to keep your balance, readings and collection on any phone',
  },
  google: { ru: 'Войти через Google', uk: 'Увійти через Google', en: 'Continue with Google' },
  email: { ru: 'Почта и пароль', uk: 'Пошта й пароль', en: 'Email and password' },
  googleHint: {
    ru: 'Через Google аккаунт создаётся сам — регистрироваться отдельно не нужно',
    uk: 'Через Google акаунт створюється сам — окремо реєструватися не треба',
    en: 'With Google, the account is created automatically',
  },
  tabIn: { ru: 'Вход', uk: 'Вхід', en: 'Sign in' },
  tabUp: { ru: 'Регистрация', uk: 'Реєстрація', en: 'Sign up' },
  skip: { ru: 'Продолжить без входа', uk: 'Продовжити без входу', en: 'Continue without an account' },
  emailPh: { ru: 'Почта', uk: 'Пошта', en: 'Email' },
  passPh: { ru: 'Пароль (от 6 символов)', uk: 'Пароль (від 6 символів)', en: 'Password (6+ characters)' },
  signIn: { ru: 'Войти', uk: 'Увійти', en: 'Sign in' },
  signUp: { ru: 'Создать аккаунт', uk: 'Створити акаунт', en: 'Create account' },
  forgot: { ru: 'Забыли пароль?', uk: 'Забули пароль?', en: 'Forgot password?' },
  resetSent: {
    ru: 'Письмо для сброса пароля отправлено — проверь почту',
    uk: 'Лист для скидання пароля надіслано — перевір пошту',
    en: 'Password reset email sent — check your inbox',
  },
  back: { ru: '← Назад', uk: '← Назад', en: '← Back' },
  keepGuest: {
    ru: 'Без входа баланс и история хранятся только на этом телефоне',
    uk: 'Без входу баланс та історія зберігаються лише на цьому телефоні',
    en: 'Without an account, your balance and history live only on this phone',
  },
  errors: {
    wrong: {
      ru: 'Неверная почта или пароль. Если ещё не регистрировался — открой «Регистрация»',
      uk: 'Невірна пошта або пароль. Якщо ще не реєструвався — відкрий «Реєстрація»',
      en: 'Wrong email or password. New here? Open “Sign up”',
    },
    cancelled: {
      ru: 'Google не завершил вход. Попробуй ещё раз или войди по почте',
      uk: 'Google не завершив вхід. Спробуй ще раз або увійди поштою',
      en: 'Google did not finish signing in. Try again or use email',
    },
    noGoogle: {
      ru: 'На телефоне нет Google-аккаунта — войди по почте',
      uk: 'На телефоні немає Google-акаунта — увійди поштою',
      en: 'No Google account on this phone — use email',
    },
    update: { ru: 'Обнови приложение до последней версии', uk: 'Онови застосунок до останньої версії', en: 'Update the app to the latest version' },
    exists: { ru: 'Аккаунт с этой почтой уже есть — войди', uk: 'Акаунт з цією поштою вже є — увійди', en: 'This email already has an account — sign in' },
    weak: { ru: 'Пароль слишком простой — минимум 6 символов', uk: 'Пароль занадто простий — мінімум 6 символів', en: 'Password too weak — at least 6 characters' },
    email: { ru: 'Проверь адрес почты', uk: 'Перевір адресу пошти', en: 'Check the email address' },
    network: { ru: 'Нет связи, попробуй ещё раз', uk: 'Немає зв’язку, спробуй ще раз', en: 'No connection, try again' },
    other: { ru: 'Не получилось войти, попробуй ещё раз', uk: 'Не вдалося увійти, спробуй ще раз', en: 'Could not sign in, try again' },
  },
};

interface AuthError { text: string; detail: string }

function errorText(e: unknown, l: L): AuthError {
  const raw = String((e as { code?: string })?.code || (e as Error)?.message || e);
  const detail = [(e as { code?: string })?.code, (e as Error)?.message].filter(Boolean).join(' · ') || raw;
  const msg = detail.toLowerCase();
  const pick = (k: keyof typeof T.errors) => ({ text: T.errors[k][l], detail });
  if (/plugin-missing|not implemented/.test(msg)) return pick('update');
  if (/cancel/.test(msg)) return pick('cancelled');
  if (/no credential|no account/.test(msg)) return pick('noGoogle');
  if (/weak/.test(msg)) return pick('weak');
  if (/already|in use|in-use/.test(msg)) return pick('exists');
  if (/badly formatted|invalid-email|invalid email/.test(msg)) return pick('email');
  if (/password|credential|user-not-found|no user record|invalid_login/.test(msg)) return pick('wrong');
  if (/network|failed to fetch/.test(msg)) return pick('network');
  return pick('other');
}

/** Google "G" in its own colours (brand mark, not an emoji) */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function AuthScreen() {
  const appMode = useAppMode();
  const locale = useAppStore((s) => s.locale);
  const l = (locale || 'ru') as L;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'choose' | 'signin' | 'signup'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!appMode) return;
    if (shouldOfferSignIn()) setOpen(true);
    const onOpen = () => { setMode('choose'); setError(null); setOpen(true); };
    window.addEventListener('mk-open-auth', onOpen);
    return () => window.removeEventListener('mk-open-auth', onOpen);
  }, [appMode]);

  if (!appMode) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); } catch (e) { setError(errorText(e, l)); } finally { setBusy(false); }
  };
  const close = () => { skipSignIn(); setOpen(false); };
  const input = 'w-full bg-mystic-card border border-mystic-accent/20 rounded-xl p-3.5 text-mystic-text placeholder-mystic-muted/50 focus:border-mystic-gold/50 focus:outline-none';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] bg-mystic-bg/95 backdrop-blur-sm flex flex-col justify-center px-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <button onClick={close} aria-label="close" className="absolute top-4 right-4 p-2 text-mystic-muted"><X size={22} /></button>

          <div className="text-center mb-8">
            <img src="/ui/card-back.webp" alt="" className="w-20 mx-auto rounded-md shadow-[0_0_40px_rgba(212,175,55,0.3)] mb-5" />
            <h1 className="t-screen">{T.title[l]}</h1>
            <p className="text-sm text-mystic-muted mt-2 leading-snug max-w-xs mx-auto">{T.sub[l]}</p>
          </div>

          {mode === 'choose' ? (
            <div className="space-y-3">
              <button disabled={busy} onClick={() => run(signInWithGoogle)}
                className="w-full h-13 py-3.5 rounded-2xl bg-white text-[#1f1f1f] font-semibold flex items-center justify-center gap-2.5 disabled:opacity-60">
                {busy ? <Spinner size={18} /> : <GoogleMark />} {T.google[l]}
              </button>
              <p className="text-micro text-mystic-muted/70 text-center -mt-1">{T.googleHint[l]}</p>
              <button disabled={busy} onClick={() => { setMode('signup'); setError(null); }}
                className="w-full py-3.5 rounded-2xl btn-secondary font-semibold flex items-center justify-center gap-2.5">
                <Icon icon={Mail} size={18} /> {T.email[l]}
              </button>
              <button onClick={close} className="w-full py-3 text-sm text-mystic-muted underline underline-offset-4">{T.skip[l]}</button>
              <p className="text-micro text-mystic-muted/70 text-center">{T.keepGuest[l]}</p>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(e) => {
              e.preventDefault();
              run(() => (mode === 'signup' ? signUpWithEmail : signInWithEmail)(email.trim(), password));
            }}>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-mystic-card border border-mystic-accent/15">
                {(['signin', 'signup'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { setMode(m); setError(null); setNotice(null); }}
                    className={`py-2 rounded-xl text-sm font-semibold transition-colors ${mode === m ? 'bg-mystic-gold/20 text-mystic-gold' : 'text-mystic-muted'}`}>
                    {m === 'signin' ? T.tabIn[l] : T.tabUp[l]}
                  </button>
                ))}
              </div>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.emailPh[l]} className={input} />
              <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder={T.passPh[l]} className={input} />
              <button type="submit" disabled={busy || !email.includes('@') || password.length < 6}
                className="w-full py-3.5 rounded-2xl btn-primary font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {busy && <Spinner size={18} />} {mode === 'signup' ? T.signUp[l] : T.signIn[l]}
              </button>
              {mode === 'signin' && (
                <div className="text-right text-sm">
                  <button type="button" disabled={!email.includes('@') || busy}
                    onClick={() => run(async () => { await resetPassword(email.trim()); setNotice(T.resetSent[l]); })}
                    className="text-mystic-muted disabled:opacity-40">{T.forgot[l]}</button>
                </div>
              )}
              <button type="button" onClick={() => { setMode('choose'); setError(null); }} className="text-sm text-mystic-muted">{T.back[l]}</button>
            </form>
          )}

          {error && (
            <div className="mt-4 text-center">
              <p className="text-sm text-mystic-danger">{error.text}</p>
              <p className="mt-1 text-micro text-mystic-muted/60 break-words select-text">{error.detail}</p>
            </div>
          )}
          {notice && <p className="mt-4 text-center text-sm text-mystic-success">{notice}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
