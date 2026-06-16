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

export async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  return tgApi('answerPreCheckoutQuery', {
    pre_checkout_query_id: queryId,
    ok,
    error_message: errorMessage,
  });
}

// ─── Mini App Data Validation ────────────────────────────────────────────────

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

  return { valid: computedHash === hash, data };
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
