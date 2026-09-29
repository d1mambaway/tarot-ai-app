/**
 * POST /api/webhook — Telegram Bot webhook handler
 * Handles /start, admin commands, mana/premium payments, and pre-checkout queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, answerPreCheckoutQuery, tgApi } from '@/lib/telegram';
import { db } from '@/lib/db';
import { telegramWebhookAuthorized } from '@/lib/secrets';
import { grantPremium, revokePremium, checkPremium } from '@/lib/premium';
import { applyStartParam, REFERRAL_NOTICE } from '@/lib/user-limits';
import { resolvePayload, starterOfferAvailable, STARTER_OFFER } from '@/lib/shop';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Admin usernames from env (comma-separated, lowercase)
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'd1mamba')
  .split(',')
  .map(u => u.trim().toLowerCase())
  .filter(Boolean);

type Locale = 'ru' | 'uk' | 'en';

function detectLocale(langCode?: string): Locale {
  if (langCode === 'uk') return 'uk';
  if (langCode === 'ru' || langCode === 'be') return 'ru';
  return 'en';
}

const WELCOME: Record<Locale, string> = {
  ru: '✨ Добро пожаловать в <b>Магию Карт</b>!\nНажми кнопку ниже, чтобы открыть приложение 🔮',
  uk: '✨ Ласкаво просимо до <b>Магії Карт</b>!\nНатисни кнопку нижче, щоб відкрити додаток 🔮',
  en: '✨ Welcome to <b>Magic of Cards</b>!\nTap the button below to open the app 🔮',
};

const OPEN_BTN: Record<Locale, string> = {
  ru: '🔮',
  uk: '🔮',
  en: '🔮',
};

const PAYMENT_THANKS: Record<Locale, string> = {
  ru: '✅ Готово! Оракулы начислены 💎\nОткрой приложение, чтобы увидеть баланс.',
  uk: '✅ Готово! Оракули нараховані 💎\nВідкрий додаток, щоб побачити баланс.',
  en: '✅ Done! Oracles credited 💎\nOpen the app to see your balance.',
};

// ─── Admin helpers ─────────────────────────────────────────────────────────

async function isAdmin(telegramId: bigint, username?: string): Promise<boolean> {
  if (username && ADMIN_USERNAMES.includes(username.toLowerCase())) return true;
  const user = await db.user.findUnique({ where: { telegramId } });
  return user?.isAdmin === true;
}

async function findUser(query: string) {
  // Try as telegram ID first
  const asNumber = parseInt(query.replace('@', ''), 10);
  if (!isNaN(asNumber) && query.replace('@', '') === String(asNumber)) {
    return db.user.findUnique({ where: { telegramId: BigInt(asNumber) } });
  }
  // Try as username
  const username = query.replace('@', '');
  return db.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
}

async function handleAdminCommand(chatId: number, text: string) {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  // ─── /admin — help ───────────────────────────────────────────────
  if (cmd === '/admin') {
    await sendMessage(chatId,
      '🔐 <b>Админ-панель</b>\n\n' +
      '💎 <b>Оракулы:</b>\n' +
      '<code>/mana @username 500</code> — начислить 500 оракулов\n' +
      '<code>/mana @username -100</code> — снять 100 оракулов\n' +
      '<code>/setmana @username 1000</code> — установить ровно 1000\n' +
      '<code>/balance @username</code> — посмотреть баланс\n\n' +
      '📊 <b>Статистика:</b>\n' +
      '<code>/stats</code> — общая статистика\n' +
      '<code>/check</code> — юзеры + новые с последней проверки\n' +
      '<code>/users</code> — последние 10 юзеров\n' +
      '<code>/find @username</code> — найти юзера\n' +
      '<code>/sources</code> — откуда приходят и кто платит (метки ?start=)\n\n' +
      '🃏 <b>Карта дня:</b>\n' +
      '<code>/resetcotd</code> — сбросить свою карту дня\n' +
      '<code>/resetcotd @username</code> — сбросить карту дня юзеру\n\n' +
      '👑 <b>Премиум:</b>\n' +
      '<code>/premium_grant @username 30</code> — дать премиум на 30 дней\n' +
      '<code>/premium_revoke @username</code> — забрать премиум\n' +
      '<code>/premium_status @username</code> — статус премиума\n\n' +
      '⭐ <b>Stars:</b>\n' +
      '<code>/stars</code> — баланс и последние транзакции\n\n' +
      '🃏 <b>Коллекция:</b>\n' +
      '<code>/unlockall</code> — открыть все 78 карт себе\n' +
      '<code>/unlockall @username</code> — открыть все карты юзеру\n' +
      '<code>/lockall</code> — закрыть все карты себе\n' +
      '<code>/lockall @username</code> — закрыть все карты юзеру\n' +
      '<code>/lockall minor</code> — закрыть только Младшие Арканы\n\n' +
      'Вместо @username можно использовать Telegram ID.');
    return;
  }

  // ─── /mana — give/take mana ──────────────────────────────────────
  if (cmd === '/mana') {
    if (parts.length < 3) {
      await sendMessage(chatId, '❌ Формат: <code>/mana @username количество</code>\nПример: <code>/mana @user 500</code>');
      return;
    }
    const target = await findUser(parts[1]);
    const amount = parseInt(parts[2], 10);
    if (!target) { await sendMessage(chatId, `❌ Юзер <code>${parts[1]}</code> не найден`); return; }
    if (isNaN(amount)) { await sendMessage(chatId, '❌ Количество должно быть числом'); return; }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { mana: { increment: amount } },
    });

    const sign = amount >= 0 ? '+' : '';
    await sendMessage(chatId,
      `✅ <b>${sign}${amount}</b> оракулов → @${target.username || target.firstName}\n` +
      `💎 Баланс: <b>${updated.mana}</b>`);

    // Notify the user
    if (target.telegramId !== BigInt(chatId)) {
      const userMsg = amount >= 0
        ? `🎁 <b>Вам начислено ${amount} оракулов!</b>\n💎 Ваш баланс: <b>${updated.mana}</b>`
        : `💎 <b>Списано ${Math.abs(amount)} оракулов</b>\n💎 Ваш баланс: <b>${updated.mana}</b>`;
      await sendMessage(target.telegramId.toString(), userMsg).catch(() => {});
    }
    return;
  }

  // ─── /setmana — set exact mana ───────────────────────────────────
  if (cmd === '/setmana') {
    if (parts.length < 3) {
      await sendMessage(chatId, '❌ Формат: <code>/setmana @username количество</code>');
      return;
    }
    const target = await findUser(parts[1]);
    const amount = parseInt(parts[2], 10);
    if (!target) { await sendMessage(chatId, `❌ Юзер <code>${parts[1]}</code> не найден`); return; }
    if (isNaN(amount) || amount < 0) { await sendMessage(chatId, '❌ Количество должно быть ≥ 0'); return; }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { mana: amount },
    });

    await sendMessage(chatId,
      `✅ Оракулы установлены: <b>${updated.mana}</b> → @${target.username || target.firstName}`);

    // Notify the user
    if (target.telegramId !== BigInt(chatId)) {
      await sendMessage(target.telegramId.toString(),
        `💎 <b>Ваш баланс оракулов обновлён</b>\n💎 Баланс: <b>${updated.mana}</b>`
      ).catch(() => {});
    }
    return;
  }

  // ─── /balance — check user balance ───────────────────────────────
  if (cmd === '/balance') {
    if (parts.length < 2) {
      await sendMessage(chatId, '❌ Формат: <code>/balance @username</code>');
      return;
    }
    const target = await findUser(parts[1]);
    if (!target) { await sendMessage(chatId, `❌ Юзер <code>${parts[1]}</code> не найден`); return; }

    await sendMessage(chatId,
      `👤 <b>${target.firstName || '—'}</b> (@${target.username || '—'})\n` +
      `💎 Оракулы: <b>${target.mana}</b>\n` +
      `🆔 ID: <code>${target.telegramId}</code>\n` +
      `📅 Стрик: ${target.streakDays} дн.\n` +
      `🎁 Бонусы: ${target.bonusReads}`);
    return;
  }

  // ─── /stats — overall statistics ─────────────────────────────────
  if (cmd === '/stats') {
    const [userCount, readingCount, totalMana, paymentStats] = await Promise.all([
      db.user.count(),
      db.reading.count(),
      db.user.aggregate({ _sum: { mana: true } }),
      db.payment.aggregate({ _sum: { starsAmount: true, manaAmount: true }, _count: true }),
    ]);

    await sendMessage(chatId,
      '📊 <b>Статистика</b>\n\n' +
      `👤 Юзеров: <b>${userCount}</b>\n` +
      `🔮 Раскладов: <b>${readingCount}</b>\n` +
      `💎 Оракулов всего: <b>${totalMana._sum.mana || 0}</b>\n` +
      `⭐ Stars заработано: <b>${paymentStats._sum.starsAmount || 0}</b>\n` +
      `💰 Платежей: <b>${paymentStats._count || 0}</b>`);
    return;
  }

  // ─── /sources — which deep links (TikTok / Shorts) bring payers ────
  if (cmd === '/sources') {
    const [bySource, payments] = await Promise.all([
      db.user.groupBy({ by: ['source'], _count: { _all: true } }),
      db.payment.findMany({
        where: { status: 'completed' },
        select: { starsAmount: true, userId: true, user: { select: { source: true } } },
      }),
    ]);
    const stats = new Map<string, { users: number; payers: Set<string>; stars: number }>();
    const row = (k: string) => {
      if (!stats.has(k)) stats.set(k, { users: 0, payers: new Set(), stars: 0 });
      return stats.get(k)!;
    };
    for (const g of bySource) row(g.source || '—').users = g._count._all;
    for (const p of payments) {
      const r = row(p.user?.source || '—');
      r.stars += p.starsAmount;
      if (p.userId) r.payers.add(p.userId);
    }
    const lines = Array.from(stats.entries())
      .sort((a, b) => b[1].stars - a[1].stars || b[1].users - a[1].users)
      .slice(0, 25)
      .map(([k, v]) => `<code>${k}</code> — 👤 ${v.users} · 💳 ${v.payers.size} · ⭐ ${v.stars}`);
    await sendMessage(chatId,
      '📈 <b>Источники</b> (юзеры · платящие · Stars)\n\n' + (lines.join('\n') || 'пока пусто') +
      '\n\nСсылка для ролика: <code>https://t.me/cardsofmagic_bot?start=tt_имя</code>');
    return;
  }

  // ─── /users — last 10 users ──────────────────────────────────────
  if (cmd === '/users') {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        username: true, firstName: true, telegramId: true,
        mana: true, createdAt: true,
        _count: { select: { readings: true } },
      },
    });

    let msg = '👥 <b>Последние 10 юзеров:</b>\n\n';
    for (const u of users) {
      const name = u.username ? `@${u.username}` : (u.firstName || '—');
      const date = u.createdAt.toLocaleDateString('ru');
      msg += `${name} — 💎${u.mana} — 🔮${u._count.readings} — ${date}\n`;
    }
    await sendMessage(chatId, msg);
    return;
  }

  // ─── /find — search user ─────────────────────────────────────────
  if (cmd === '/find') {
    if (parts.length < 2) {
      await sendMessage(chatId, '❌ Формат: <code>/find @username</code>');
      return;
    }
    const target = await findUser(parts[1]);
    if (!target) { await sendMessage(chatId, `❌ Юзер <code>${parts[1]}</code> не найден`); return; }

    const readings = await db.reading.count({ where: { userId: target.id } });
    const lastReading = await db.reading.findFirst({
      where: { userId: target.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, type: true },
    });
    const payments = await db.payment.aggregate({
      where: { userId: target.id },
      _sum: { starsAmount: true, manaAmount: true },
      _count: true,
    });

    await sendMessage(chatId,
      `👤 <b>${target.firstName || '—'}</b> (@${target.username || '—'})\n` +
      `🆔 <code>${target.telegramId}</code>\n` +
      `💎 Оракулы: <b>${target.mana}</b>\n` +
      `🔮 Раскладов: ${readings}\n` +
      `🕐 Последний расклад: ${lastReading ? `${lastReading.createdAt.toLocaleString('ru', { timeZone: 'Europe/Kyiv' })} (${lastReading.type})` : 'нет'}\n` +
      `📅 Стрик: ${target.streakDays} дн.\n` +
      `🎁 Бонусы: ${target.bonusReads}\n` +
      `📢 Подписка на канал: ${target.channelSubBonus ? '✅' : '❌'}\n` +
      `⭐ Stars потрачено: ${payments._sum.starsAmount || 0}\n` +
      `💰 Платежей: ${payments._count || 0}\n` +
      `🗓 Регистрация: ${target.createdAt.toLocaleDateString('ru')}`);
    return;
  }

  // ─── /resetcotd — reset card of the day ───────────────────────────
  if (cmd === '/resetcotd') {
    const targetIdent = parts.length >= 2 ? parts[1] : null;
    let target;
    if (targetIdent) {
      target = await findUser(targetIdent);
    } else {
      target = await db.user.findFirst({ where: { telegramId: BigInt(chatId) } });
    }
    if (!target) { await sendMessage(chatId, '❌ Юзер не найден'); return; }

    // Card day boundary — resets at 6:00 UTC
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setUTCHours(6, 0, 0, 0);
    if (now < dayStart) dayStart.setUTCDate(dayStart.getUTCDate() - 1);

    const deleted = await db.reading.deleteMany({
      where: {
        userId: target.id,
        type: 'CARD_OF_DAY',
        createdAt: { gte: dayStart },
      },
    });

    await sendMessage(chatId,
      deleted.count > 0
        ? `✅ Карта дня сброшена для @${target.username || target.firstName} (удалено: ${deleted.count})`
        : `ℹ️ У @${target.username || target.firstName} нет карты дня за сегодня`
    );
    return;
  }

  // ─── /check — user stats with "new since last check" ──────────────
  if (cmd === '/check') {
    try {
      // Ensure admin_settings table exists (idempotent)
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS "admin_settings" (
          "key" TEXT PRIMARY KEY,
          "value" TEXT NOT NULL
        )`;

      // Get last check timestamp
      const rows = await db.$queryRaw<{ value: string }[]>`
        SELECT "value" FROM "admin_settings" WHERE "key" = 'last_users_check'`;
      const lastCheck = rows.length > 0 ? new Date(rows[0].value) : null;

      // Count totals
      const totalUsers = await db.user.count();
      const totalReadings = await db.reading.count();

      // New users since last check
      let newUsers: { username: string | null; firstName: string | null; telegramId: bigint; mana: number; createdAt: Date }[] = [];
      let newCount = 0;

      if (lastCheck) {
        newUsers = await db.user.findMany({
          where: { createdAt: { gt: lastCheck } },
          orderBy: { createdAt: 'desc' },
          select: { username: true, firstName: true, telegramId: true, mana: true, createdAt: true },
          take: 50,
        });
        newCount = await db.user.count({ where: { createdAt: { gt: lastCheck } } });
      }

      // Save current check time
      const now = new Date().toISOString();
      await db.$executeRaw`
        INSERT INTO "admin_settings" ("key", "value")
        VALUES ('last_users_check', ${now})
        ON CONFLICT ("key") DO UPDATE SET "value" = ${now}`;

      // Build message
      let msg = `📊 <b>Статистика пользователей</b>\n\n`;
      msg += `👤 Всего юзеров: <b>${totalUsers}</b>\n`;
      msg += `🔮 Всего раскладов: <b>${totalReadings}</b>\n`;

      if (!lastCheck) {
        msg += `\n🆕 Первая проверка — в следующий раз покажу новых юзеров`;
      } else {
        const timeDiff = Date.now() - lastCheck.getTime();
        const hours = Math.floor(timeDiff / 3600000);
        const mins = Math.floor((timeDiff % 3600000) / 60000);
        const timeAgo = hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;

        msg += `\n⏱ С последней проверки (${timeAgo} назад):\n`;
        msg += `🆕 Новых юзеров: <b>${newCount}</b>\n`;

        if (newUsers.length > 0) {
          msg += `\n<b>Новые:</b>\n`;
          for (const u of newUsers) {
            const name = u.username ? `@${u.username}` : (u.firstName || '—');
            const date = u.createdAt.toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            msg += `• ${name} — 💎${u.mana} — ${date}\n`;
          }
          if (newCount > 50) {
            msg += `\n... и ещё ${newCount - 50}\n`;
          }
        }
      }

      await sendMessage(chatId, msg);
    } catch (e) {
      console.error('/check error:', e);
      await sendMessage(chatId, '❌ Ошибка при получении статистики');
    }
    return;
  }

  // ─── /unlockall — unlock all 78 cards for a user ─────────────────
  if (cmd === '/unlockall') {
    const targetIdent = parts.length >= 2 ? parts[1] : null;
    let target;
    if (targetIdent) {
      target = await findUser(targetIdent);
    } else {
      target = await db.user.findFirst({ where: { telegramId: BigInt(chatId) } });
    }
    if (!target) { await sendMessage(chatId, '❌ Юзер не найден'); return; }

    const existing = await db.cardCollection.findMany({
      where: { userId: target.id },
      select: { cardId: true },
    });
    const existingIds = new Set(existing.map(c => c.cardId));

    const toCreate = [];
    for (let i = 0; i < 78; i++) {
      if (!existingIds.has(i)) {
        toCreate.push({ userId: target.id, cardId: i });
      }
    }

    if (toCreate.length > 0) {
      await db.cardCollection.createMany({ data: toCreate });
    }

    await sendMessage(chatId,
      `✅ Все 78 карт открыты для @${target.username || target.firstName}\n` +
      `🆕 Новых: ${toCreate.length}, было: ${existingIds.size}`);
    return;
  }

  // ─── /stars — check bot's star balance & recent transactions ─────
  if (cmd === '/stars') {
    try {
      const result = await tgApi('getStarTransactions', { limit: 10 });
      if (!result.ok) {
        await sendMessage(chatId, '❌ Не удалось получить транзакции');
        return;
      }
      const transactions = result.result?.transactions || [];
      let totalIn = 0;
      let totalOut = 0;
      for (const t of transactions) {
        if (t.amount > 0) totalIn += t.amount;
        else totalOut += Math.abs(t.amount);
      }

      let msg = '⭐ <b>Stars транзакции</b>\n\n';

      // DB stats
      const dbStats = await db.payment.aggregate({ _sum: { starsAmount: true }, _count: true });
      msg += `💰 Платежей в БД: <b>${dbStats._count || 0}</b>\n`;
      msg += `⭐ Stars в БД: <b>${dbStats._sum.starsAmount || 0}</b>\n\n`;

      if (transactions.length === 0) {
        msg += 'Транзакций пока нет';
      } else {
        msg += `<b>Последние ${transactions.length}:</b>\n`;
        for (const t of transactions) {
          const date = new Date(t.date * 1000).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          const sign = t.amount > 0 ? '+' : '';
          const from = t.source?.user ? `@${t.source.user.username || t.source.user.first_name}` : (t.receiver?.user ? `→ @${t.receiver.user.username || t.receiver.user.first_name}` : '');
          msg += `${sign}${t.amount} ⭐ ${from} — ${date}\n`;
        }
      }

      await sendMessage(chatId, msg);
    } catch (e) {
      console.error('/stars error:', e);
      await sendMessage(chatId, '❌ Ошибка при получении транзакций');
    }
    return;
  }

  // ─── /lockall — lock all cards for a user ────────────────────────
  if (cmd === '/lockall') {
    const minorOnly = parts.includes('minor');
    // Find username argument (skip 'minor' keyword)
    const userArg = parts.slice(1).find(p => p.toLowerCase() !== 'minor');
    let target;
    if (userArg) {
      target = await findUser(userArg);
    } else {
      target = await db.user.findFirst({ where: { telegramId: BigInt(chatId) } });
    }
    if (!target) { await sendMessage(chatId, '❌ Юзер не найден'); return; }

    const deleted = await db.cardCollection.deleteMany({
      where: {
        userId: target.id,
        ...(minorOnly ? { cardId: { gt: 21 } } : {}),
      },
    });

    await sendMessage(chatId,
      minorOnly
        ? `🔒 Младшие Арканы закрыты для @${target.username || target.firstName}\n🗑 Удалено: ${deleted.count} (Старшие сохранены)`
        : `🔒 Все карты закрыты для @${target.username || target.firstName}\n🗑 Удалено: ${deleted.count}`);
    return;
  }

  // ─── /premium_grant — give premium ─────────────────────────────────
  if (cmd === '/premium_grant') {
    if (parts.length < 3) {
      await sendMessage(chatId, '❌ Формат: <code>/premium_grant @username дни</code>\nПример: <code>/premium_grant @user 30</code>');
      return;
    }
    const target = await findUser(parts[1]);
    if (!target) { await sendMessage(chatId, '❌ Юзер не найден'); return; }
    const days = parseInt(parts[2], 10);
    if (isNaN(days) || days < 1) { await sendMessage(chatId, '❌ Укажи кол-во дней (число > 0)'); return; }
    const result = await grantPremium(target.id, days);
    await sendMessage(chatId,
      `👑 Премиум выдан @${target.username || target.firstName}\n` +
      `📅 До: ${result.expiresAt!.toLocaleDateString('ru-RU')}\n` +
      `⏳ Осталось: ${result.daysLeft} дней`);

    // Notify the user
    if (target.telegramId !== BigInt(chatId)) {
      await sendMessage(target.telegramId.toString(),
        `👑 <b>Вам подключён Премиум!</b>\n\n` +
        `✨ Безлимитный доступ ко всем функциям\n` +
        `📅 Действует до: <b>${result.expiresAt!.toLocaleDateString('ru-RU')}</b>\n` +
        `⏳ ${result.daysLeft} дней\n\n` +
        `Откройте приложение и наслаждайтесь! 🔮`
      ).catch(() => {});
    }
    return;
  }

  // ─── /premium_revoke — remove premium ──────────────────────────────
  if (cmd === '/premium_revoke') {
    if (parts.length < 2) {
      await sendMessage(chatId, '❌ Формат: <code>/premium_revoke @username</code>');
      return;
    }
    const target = await findUser(parts[1]);
    if (!target) { await sendMessage(chatId, '❌ Юзер не найден'); return; }
    const ok = await revokePremium(target.id);
    await sendMessage(chatId,
      ok ? `🚫 Премиум отозван у @${target.username || target.firstName}`
         : `❌ У @${target.username || target.firstName} нет активного премиума`);

    // Notify the user
    if (ok && target.telegramId !== BigInt(chatId)) {
      await sendMessage(target.telegramId.toString(),
        `ℹ️ <b>Ваш Премиум-статус отключён</b>\n\n` +
        `Оракулы на балансе сохранены. Вы можете оформить Премиум заново в магазине. 🛒`
      ).catch(() => {});
    }
    return;
  }

  // ─── /premium_status — check premium ───────────────────────────────
  if (cmd === '/premium_status') {
    if (parts.length < 2) {
      await sendMessage(chatId, '❌ Формат: <code>/premium_status @username</code>');
      return;
    }
    const target = await findUser(parts[1]);
    if (!target) { await sendMessage(chatId, '❌ Юзер не найден'); return; }
    const status = await checkPremium(target.id);
    if (status.isPremium) {
      await sendMessage(chatId,
        `👑 <b>Премиум активен</b> — @${target.username || target.firstName}\n` +
        `📋 План: ${status.plan}\n` +
        `📅 До: ${status.expiresAt!.toLocaleDateString('ru-RU')}\n` +
        `⏳ Осталось: ${status.daysLeft} дней`);
    } else {
      await sendMessage(chatId, `❌ @${target.username || target.firstName} — нет премиума`);
    }
    return;
  }
}

// ─── Main webhook handler ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Verify this request actually comes from Telegram.
    // Telegram echoes back the `secret_token` we passed to setWebhook in the
    // `X-Telegram-Bot-Api-Secret-Token` header on every update. Without this
    // check anyone who knows the webhook URL could forge admin commands or
    // fake successful_payment updates.
    // Fails closed in production when TELEGRAM_WEBHOOK_SECRET is missing.
    if (!telegramWebhookAuthorized(req.headers.get('x-telegram-bot-api-secret-token'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await req.json();

    if (update.message?.text) {
      const text = update.message.text;
      const chatId = update.message.chat.id;
      const telegramId = BigInt(update.message.from.id);
      const username = update.message.from?.username;

      // ─── Admin commands ────────────────────────────────────────────
      const adminCmds = ['/admin', '/sources', '/mana', '/setmana', '/balance', '/stats', '/users', '/find', '/check', '/unlockall', '/lockall', '/resetcotd', '/stars', '/premium_grant', '/premium_revoke', '/premium_status'];
      const firstWord = text.trim().split(/\s+/)[0].toLowerCase();

      if (adminCmds.includes(firstWord)) {
        if (await isAdmin(telegramId, username)) {
          try {
            await handleAdminCommand(chatId, text);
          } catch (adminErr: any) {
            console.error('Admin command error:', adminErr);
            await sendMessage(chatId, `❌ Ошибка команды:\n<code>${(adminErr?.message || String(adminErr)).slice(0, 300)}</code>`);
          }
        } else {
          await sendMessage(chatId, '🚫 Нет доступа');
        }
        return NextResponse.json({ ok: true });
      }

      // ─── /start command ────────────────────────────────────────────
      if (text.startsWith('/start')) {
        const locale = detectLocale(update.message.from?.language_code);
        const startParam = text.split(' ')[1] || '';

        await sendMessage(chatId, WELCOME[locale], {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: OPEN_BTN[locale],
                  web_app: { url: `${APP_URL}?startapp=${startParam}` },
                },
              ],
            ],
          },
        });

        // Register user in DB (best-effort). A brand-new user gets the start
        // param applied: ref_<id> pays the inviter, anything else is stored as
        // the acquisition source (links from TikTok / Shorts).
        try {
          const isAdminUser = ADMIN_USERNAMES.includes(username?.toLowerCase() || '');
          const existing = await db.user.findUnique({ where: { telegramId }, select: { id: true } });
          if (existing) {
            await db.user.update({
              where: { id: existing.id },
              data: {
                username: update.message.from.username,
                firstName: update.message.from.first_name,
                ...(isAdminUser ? { isAdmin: true } : {}),
              },
            });
          } else {
            const created = await db.user.create({
              data: {
                telegramId,
                username: update.message.from.username,
                firstName: update.message.from.first_name,
                locale,
                mana: 200,
                firstReadingFree: true,
                isAdmin: isAdminUser,
              },
            });
            const { referrer } = await applyStartParam(created.id, startParam);
            if (referrer) {
              const rl = (['ru', 'uk', 'en'].includes(referrer.locale) ? referrer.locale : 'ru') as Locale;
              await sendMessage(referrer.telegramId.toString(), REFERRAL_NOTICE[rl]).catch(() => {});
            }
          }
        } catch (e) {
          console.error('DB register on /start:', e);
        }
      }
    }

    // ─── Pre-checkout query (Stars payment) ────────────────────────────
    // Last chance to refuse before Stars are taken: the payload must name a
    // real catalog item, the amount must match the catalog, and the starter
    // offer must still be available to this user.
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;
      const resolved = resolvePayload(q.invoice_payload);
      let ok = !!resolved && q.currency === 'XTR' && q.total_amount === resolved.stars;
      if (ok && resolved!.payload.type === 'mana_pack' && resolved!.payload.packId === STARTER_OFFER.id) {
        const buyer = await db.user.findUnique({ where: { telegramId: BigInt(q.from.id) } });
        const bought = await db.payment.count({
          where: { telegramId: BigInt(q.from.id), itemId: STARTER_OFFER.id, status: 'completed' },
        });
        ok = !!buyer && starterOfferAvailable(buyer.createdAt, bought > 0);
      }
      await answerPreCheckoutQuery(q.id, ok, ok ? undefined : 'Offer is no longer available');
    }

    // ─── Successful payment → credit mana / premium ────────────────────
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      const telegramId = BigInt(update.message.from.id);
      const locale = detectLocale(update.message.from?.language_code);
      const chargeId: string = payment.telegram_payment_charge_id;
      const resolved = resolvePayload(payment.invoice_payload);

      if (!resolved) {
        console.error('successful_payment with unknown payload:', payment.invoice_payload, chargeId);
        return NextResponse.json({ ok: true });
      }

      // One transaction: the payment row (unique charge id = idempotency key)
      // and the credit either both land or neither does. Before, the row was
      // written first, so a failed credit left a "pending" payment that every
      // Telegram retry skipped as a duplicate — Stars taken, nothing credited.
      let credited = false;
      try {
        await db.$transaction(async (tx) => {
          const user = await tx.user.upsert({
            where: { telegramId },
            create: {
              telegramId,
              username: update.message.from.username,
              firstName: update.message.from.first_name,
              locale,
              mana: 200,
              firstReadingFree: true,
            },
            update: {},
          });

          await tx.payment.create({
            data: {
              telegramId,
              userId: user.id,
              starsAmount: payment.total_amount,
              manaAmount: resolved.mana,
              itemType: resolved.payload.type,
              itemId: resolved.payload.type === 'premium' ? resolved.payload.planId : resolved.payload.packId,
              telegramPayId: chargeId,
              status: 'completed',
            },
          });

          if (resolved.payload.type === 'premium') {
            await grantPremium(user.id, resolved.days, chargeId, tx);
          } else if (resolved.mana > 0) {
            await tx.user.update({
              where: { id: user.id },
              data: { mana: { increment: resolved.mana } },
            });
          }
        });
        credited = true;
      } catch (e: any) {
        if (e?.code === 'P2002') {
          // Telegram retried an update we already processed
          console.warn('Duplicate successful_payment ignored:', chargeId);
          return NextResponse.json({ ok: true });
        }
        console.error('Payment processing error:', chargeId, e);
        // Non-2xx makes Telegram redeliver the update, so a transient DB error
        // is retried instead of the payment being lost.
        return NextResponse.json({ ok: false }, { status: 500 });
      }

      if (credited) {
        const PREMIUM_THANKS: Record<Locale, string> = {
          ru: '👑 Премиум активирован! Безлимитный доступ ко всем функциям.\nОткрой приложение — теперь всё без ограничений ✨',
          uk: '👑 Преміум активовано! Безлімітний доступ до всіх функцій.\nВідкрий додаток — тепер все без обмежень ✨',
          en: '👑 Premium activated! Unlimited access to all features.\nOpen the app — no limits now ✨',
        };
        await sendMessage(chatId, resolved.payload.type === 'premium' ? PREMIUM_THANKS[locale] : PAYMENT_THANKS[locale]).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
