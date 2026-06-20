# 🔮 Магия Карт — Telegram Mini App

AI-таро расклады и эзотерика в Telegram Mini App.

**Бот:** [@cardsofmagic_bot](https://t.me/cardsofmagic_bot)

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes (serverless на Vercel) |
| AI | Groq API (llama-3.3-70b-versatile) |
| БД | PostgreSQL через Prisma |
| Платежи | Telegram Stars (XTR) |
| Хостинг | Vercel |
| Языки | 🇷🇺 Русский / 🇺🇦 Українська / 🇬🇧 English (авто по TG language_code) |

## Функции

### Таро расклады
| Расклад | Стоимость |
|---------|-----------|
| 🌅 Карта дня | Бесплатно |
| ✅ Да/Нет | 50 |
| ⏳ Прошлое—Настоящее—Будущее | 50 |
| 💕 На отношения | 80 |
| 🧠 Что обо мне думает | 80 |
| 💰 Карьера и деньги | 80 |
| 📅 На неделю | 100 |
| 🗓️ На месяц | 120 |
| ✝️ Кельтский крест | 200 |
| ❓ Свободный вопрос | 50 |

### Эзотерика
| Расклад | Стоимость |
|---------|-----------|
| ♈ Гороскоп | 50 |
| ᚱ Руны | 50 |
| 💤 Толкование снов | 50 |
| 👼 Ангельские числа | 50 |
| 🌙 Лунная фаза | 50 |
| 🔢 Нумерология | 80 |
| 🧘 Чакры | 80 |
| 💞 Совместимость | 100 |
| 🕰️ Прошлые жизни | 120 |

### Геймификация
- 🃏 Коллекция — все 78 карт (22 старших + 56 младших арканов)
- 🔥 Стрики — ежедневный бонус +50 оракулов (7-й день +300)
- 📺 Подписка на канал +1000 оракулов
- 👥 Реферальная система +500 оракулов

### Экономика (Оракулы = мана)
- Стартовый баланс: 200 оракулов
- Пополнение через Telegram Stars:

| Пакет | Оракулы | Stars |
|-------|---------|-------|
| Малый | 500 | 50 ⭐ |
| Средний | 1 500 | 125 ⭐ |
| Большой | 5 000 | 350 ⭐ |
| Мега | 15 000 | 750 ⭐ |

## Архитектура

SPA внутри Telegram Mini App. Все экраны на одной `page.tsx`, навигация через Zustand store.

```
src/
├── app/
│   ├── api/
│   │   ├── card-of-day/     — Карта дня
│   │   ├── reading/         — Генерация AI расклада
│   │   ├── reading-lite/    — Легкие расклады (нумерология, руны и т.д.)
│   │   ├── followup/        — Дополнительные вопросы к раскладу
│   │   ├── payment/         — Оплата Stars
│   │   ├── webhook/         — Telegram bot webhook
│   │   ├── user/            — Авторизация и управление
│   │   ├── check-subscription/ — Проверка подписки на канал
│   │   ├── admin/           — Админ панель
│   │   ├── cron/            — Cron задачи
│   │   ├── setup-bot/       — Настройка бота
│   │   └── support/         — Поддержка
│   ├── globals.css          — Стили + кастомные анимации
│   ├── layout.tsx
│   └── page.tsx             — Точка входа Mini App
├── components/
│   ├── layout/              — Экраны (Home, Tarot, Esoteric, Collection, Shop, Profile и т.д.)
│   └── ui/                  — UI компоненты (LoadingScreen, StarField, SolarSystem, ManaIcon и т.д.)
├── data/
│   ├── tarot-cards.ts       — Все 78 карт (названия RU/UK/EN + ключевые слова)
│   └── spreads.ts           — Конфигурация всех раскладов
├── lib/
│   ├── grok.ts              — Groq API клиент + промпты
│   ├── telegram.ts          — TG Bot & Mini App утилиты
│   ├── db.ts                — Prisma клиент
│   ├── rate-limit.ts        — Rate limiting (in-memory sliding window)
│   ├── user-limits.ts       — Лимиты и подписки
│   └── haptics.ts           — Тактильная обратная связь
└── store/
    └── app-store.ts         — Zustand состояние приложения
```

### Ассеты
```
public/
├── cards/
│   ├── major/               — 22 старших аркана (.png, 400×600)
│   └── minor/               — 56 младших арканов (.webp, 400×600)
│       ├── wands-01..14
│       ├── cups-01..14
│       ├── swords-01..14
│       └── pentacles-01..14
└── ui/
    ├── nav/                 — Иконки навигации
    ├── spreads/             — Хедеры раскладов (.webp)
    ├── loading-screen.png   — Загрузочный экран
    └── ...                  — Прочие UI элементы
```

### БД (Prisma)
- **User** — телеграм ID, мана, стрики, язык, админ
- **Reading** — история раскладов (21 тип)
- **Payment** — платежи Stars
- **Subscription** — подписки (Basic/Premium)
- **Referral** — реферальная система
- **CardCollection** — собранные карты

## Запуск

```bash
npm install
npx prisma generate
npx prisma db push
cp .env.example .env   # заполнить переменные
npm run dev
```

### Переменные окружения
См. `.env.example` — нужны: `TELEGRAM_BOT_TOKEN`, `GROQ_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`.

### Webhook
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/webhook"
```
