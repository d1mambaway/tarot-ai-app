'use client';

/**
 * Profile → «Аккаунт» in the Android app: who is signed in, sign out, sign
 * in for guests, and account deletion (Google Play requires it in-app).
 */

import { useEffect, useState } from 'react';
import { LogIn, LogOut, Trash2, UserRound } from 'lucide-react';
import { Icon, IconBadge, Spinner } from './Icon';
import { deleteAccount, getAccount, signOut, useAppMode, type AppAccount } from '@/lib/app-mode';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Аккаунт', uk: 'Акаунт', en: 'Account' },
  guest: { ru: 'Без входа', uk: 'Без входу', en: 'Not signed in' },
  guestHint: {
    ru: 'Баланс и история хранятся только на этом телефоне',
    uk: 'Баланс та історія зберігаються лише на цьому телефоні',
    en: 'Balance and history live only on this phone',
  },
  signIn: { ru: 'Войти или создать аккаунт', uk: 'Увійти або створити акаунт', en: 'Sign in or create an account' },
  signOut: { ru: 'Выйти', uk: 'Вийти', en: 'Sign out' },
  del: { ru: 'Удалить аккаунт', uk: 'Видалити акаунт', en: 'Delete account' },
  delConfirm: {
    ru: 'Удалить аккаунт навсегда? Баланс, расклады и коллекция будут стёрты без возможности восстановления.',
    uk: 'Видалити акаунт назавжди? Баланс, розклади й колекцію буде стерто без можливості відновлення.',
    en: 'Delete the account forever? Balance, readings and collection will be erased and cannot be restored.',
  },
  delFail: { ru: 'Не удалось удалить, попробуй позже', uk: 'Не вдалося видалити, спробуй пізніше', en: 'Could not delete, try later' },
};

export default function AppAccountCard({ locale: l }: { locale: L }) {
  const appMode = useAppMode();
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (appMode) setAccount(getAccount()); }, [appMode]);
  if (!appMode) return null;

  const remove = async () => {
    if (!window.confirm(T.delConfirm[l])) return;
    setBusy(true);
    try {
      await deleteAccount((window as any).Telegram?.WebApp?.initData || '');
    } catch {
      window.alert(T.delFail[l]);
      setBusy(false);
    }
  };

  return (
    <div className="brand-card p-4 mb-4">
      <p className="t-overline mb-3">{T.title[l]}</p>
      <div className="flex items-center gap-3">
        <IconBadge icon={UserRound} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-mystic-text truncate">{account?.email || account?.name || T.guest[l]}</p>
          {!account && <p className="text-xs text-mystic-muted leading-snug">{T.guestHint[l]}</p>}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {account ? (
          <button onClick={() => { setBusy(true); signOut(); }} disabled={busy}
            className="w-full py-2.5 rounded-xl btn-secondary text-sm font-semibold flex items-center justify-center gap-2">
            <Icon icon={LogOut} size={16} /> {T.signOut[l]}
          </button>
        ) : (
          <button onClick={() => window.dispatchEvent(new Event('mk-open-auth'))}
            className="w-full py-2.5 rounded-xl btn-primary text-sm font-bold flex items-center justify-center gap-2">
            <LogIn size={16} strokeWidth={1.8} aria-hidden /> {T.signIn[l]}
          </button>
        )}
        <button onClick={remove} disabled={busy}
          className="w-full py-2 text-xs text-mystic-danger/80 flex items-center justify-center gap-1.5 disabled:opacity-50">
          {busy ? <Spinner size={14} /> : <Trash2 size={14} strokeWidth={1.6} aria-hidden />} {T.del[l]}
        </button>
      </div>
    </div>
  );
}
