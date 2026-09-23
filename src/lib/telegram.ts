/**
 * Telegram Bot & Mini App utilities
 * - Webhook handler for bot commands
 * - Stars payment integration
 * - User validation
 */

import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Telegram API helpers ────────────────────────────────────────────────────

export async function tgApi(method: string, body?: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function sendMessage(chatId: number | string, text: string, extra?: Record<string, unknown>) {
  return tgApi('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

export async function sendPhoto(chatId: number | string, photo: string, caption?: string) {
  return tgApi('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML' });
}

/**
 * Отправить фото байтами (multipart), а не ссылкой. Когда фото рисуется по
 * запросу (например AI-генерация), sendPhoto по URL ненадёжен — у Telegram
 * свой короткий таймаут на скачивание файла по ссылке, и при малейшей
 * задержке на нашей стороне он тихо не получает картинку. Здесь мы сами
 * ждём генерацию (у нашей функции бюджет времени намного больше) и
 * загружаем уже готовые байты.
 */
export async function sendPhotoBuffer(
  chatId: number | string,
  photo: Buffer,
  filename: string,
  caption?: string
) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  form.append('photo', new Blob([photo]), filename);

  const res = await fetch(`${TG_API}/sendPhoto`, { method: 'POST', body: form });
  return res.json();
}

// ─── Stars Payments ──────────────────────────────────────────────────────────

export async function createStarsInvoice(params: {
  chatId: number;
  title: string;
  description: string;
  payload: string; // JSON string with reading details
  amount: number; // Stars amount
}) {
  return tgApi('sendInvoice', {
    chat_id: params.chatId,
    title: params.title,
    description: params.description,
    payload: params.payload,
    provider_token: '', // empty for Stars
    currency: 'XTR', // Telegram Stars currency code
    prices: [{ label: params.title, amount: params.amount }],
  });
}

/**
 * Create an invoice link for in-app payments via WebApp.openInvoice()
 */
export async function createInvoiceLink(params: {
  title: string;
  description: string;
  payload: string;
  amount: number;
}): Promise<string> {
  const result = await tgApi('createInvoiceLink', {
    title: params.title,
    description: params.description,
    payload: params.payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: params.title, amount: params.amount }],
  });
  if (!result.ok) throw new Error(result.description || 'Failed to create invoice link');
  return result.result;
}

export async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  return tgApi('answerPreCheckoutQuery', {
    pre_checkout_query_id: queryId,
    ok,
    error_message: errorMessage,
  });
}

// ─── Mini App Data Validation ────────────────────────────────────────────────

/** Constant-time hex comparison — a plain === leaks the hash byte by byte. */
function safeEqualHex(a: string, b: string | null): boolean {
  if (!b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function validateInitData(initData: string): { valid: boolean; data: Record<string, string> } {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  // Sort params alphabetically
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const data: Record<string, string> = {};
  params.forEach((v, k) => (data[k] = v));

  return { valid: safeEqualHex(computedHash, hash), data };
}

export function parseUserFromInitData(initData: string): {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
} | null {
  const { valid, data } = validateInitData(initData);
  if (!valid || !data.user) return null;

  try {
    return JSON.parse(data.user);
  } catch {
    return null;
  }
}

// ─── Webhook Setup ───────────────────────────────────────────────────────────

export async function setWebhook(url: string) {
  return tgApi('setWebhook', {
    url: `${url}/api/webhook`,
    allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'successful_payment'],
    ...(process.env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET } : {}),
  });
}

// ─── Bot Commands ────────────────────────────────────────────────────────────

export const BOT_COMMANDS = {
  start: {
    ru: 'Добро пожаловать в мир Таро ✨\nНажми кнопку ниже, чтобы открыть приложение 🔮',
    uk: 'Ласкаво просимо у світ Таро ✨\nНатисни кнопку нижче, щоб відкрити додаток 🔮',
    en: 'Welcome to the world of Tarot ✨\nTap the button below to open the app 🔮',
  },
};
