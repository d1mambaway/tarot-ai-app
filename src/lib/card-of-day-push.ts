/**
 * The morning "card of the day" push: an animation (public/ui/card-of-day.mp4)
 * with a caption and a web_app button, plain text if the animation can't be
 * sent. Used by the daily cron and by the admin /testcotd command.
 *
 * The first send uploads the video by URL; Telegram's file_id is then kept in
 * admin_settings and reused for everyone else (and the next days), so the
 * file is downloaded once instead of once per user.
 */

import { sendAnimation, sendMessage } from './telegram';
import { getSetting, setSetting } from './admin-settings';

export type Locale = 'ru' | 'uk' | 'en';

export const DAILY_MSG: Record<Locale, string> = {
  ru: '❓ <b>Что скрывает твоя карта дня?</b>\nЗвёзды сменились, колода перетасована ✨\nОтвет уже ждёт, осталось перевернуть 🔮',
  uk: '❓ <b>Що приховує твоя карта дня?</b>\nЗірки змінилися, колоду перетасовано ✨\nВідповідь уже чекає, залишилося перевернути 🔮',
  en: '❓ <b>What is your card of the day hiding?</b>\nThe stars have shifted, the deck is shuffled ✨\nYour answer is waiting, just turn the card 🔮',
};

export const OPEN_BTN: Record<Locale, string> = {
  ru: '🪄 Перевернуть карту',
  uk: '🪄 Перевернути карту',
  en: '🪄 Turn the card',
};

const ANIMATION_KEY = 'cotd_animation_file_id';
// Give up on the animation for this run after this many failures in a row
// that are not about the user (blocked bot etc.), e.g. the file is missing
const MAX_ANIMATION_FAILURES = 3;

type TgResult = {
  ok?: boolean;
  error_code?: number;
  description?: string;
  result?: { animation?: { file_id?: string }; document?: { file_id?: string } };
};

export interface PushState {
  animationId: string | null;
  animationFailures: number;
}

/** State for one run of sends: starts from the stored file_id */
export async function loadPushState(): Promise<PushState> {
  return { animationId: await getSetting(ANIMATION_KEY).catch(() => null), animationFailures: 0 };
}

export function toLocale(value: string | null | undefined): Locale {
  return (['ru', 'uk', 'en'].includes(value || '') ? value : 'ru') as Locale;
}

/**
 * Send the push to one chat. Returns how it went:
 * 'animation' | 'text' — delivered; 'blocked' — the user blocked the bot;
 * 'failed' — neither the animation nor the text went through.
 */
export async function sendCardOfDayPush(
  chatId: string | number,
  locale: Locale,
  state: PushState,
): Promise<'animation' | 'text' | 'blocked' | 'failed'> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const extra = {
    reply_markup: {
      inline_keyboard: [[{ text: OPEN_BTN[locale], web_app: { url: appUrl } }]],
    },
  };

  let res: TgResult | null = null;
  if (state.animationFailures < MAX_ANIMATION_FAILURES) {
    res = (await sendAnimation(chatId, state.animationId ?? `${appUrl}/ui/card-of-day.mp4`, DAILY_MSG[locale], extra)
      .catch(() => null)) as TgResult | null;
    if (res?.ok) {
      state.animationFailures = 0;
      const fileId = res.result?.animation?.file_id ?? res.result?.document?.file_id;
      if (fileId && fileId !== state.animationId) {
        state.animationId = fileId;
        await setSetting(ANIMATION_KEY, fileId).catch((e) => console.error('cotd push: saving file_id failed:', e));
      }
      return 'animation';
    }
    if (res?.error_code === 403) return 'blocked'; // text would fail the same way
    // Not the user's fault: a stale file_id falls back to the URL next time,
    // too many failures switch the rest of the run to text
    state.animationFailures++;
    console.error('cotd push: sendAnimation failed:', res?.error_code, res?.description);
    if (state.animationId && /file/i.test(res?.description || '')) state.animationId = null;
  }

  const text = (await sendMessage(chatId, DAILY_MSG[locale], extra).catch(() => null)) as TgResult | null;
  if (text?.ok) return 'text';
  return text?.error_code === 403 ? 'blocked' : 'failed';
}
