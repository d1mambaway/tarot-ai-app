# 🔮 Tarot AI — Telegram Mini App

AI-powered tarot readings Telegram Mini App with Grok (xAI) as the AI engine.

## Stack
- **Frontend:** Next.js 14 + React + Tailwind CSS + Framer Motion
- **Backend:** Next.js API Routes (serverless)
- **AI:** Grok API (xAI) — OpenAI-compatible
- **Database:** PostgreSQL via Prisma
- **Payments:** Telegram Stars
- **Hosting:** Vercel
- **Languages:** 🇷🇺 Russian / 🇺🇦 Ukrainian

## Features

### Tarot Spreads
- 🌅 Card of the Day (free)
- ✅ Yes/No
- ⏳ Past—Present—Future
- 💕 Relationship spread
- 🧠 "What do they think about me"
- 💰 Career & Money
- ✝️ Celtic Cross (premium)
- 📅 Weekly / 🗓️ Monthly forecast
- ❓ Free question (AI picks the spread)

### Beyond Tarot
- 💞 Compatibility analysis
- ♈ Horoscope
- 🔢 Numerology
- ᚱ Runes
- 💤 Dream interpretation
- 👼 Angel numbers
- 🌙 Moon phases
- 🕰️ Past lives
- 🧘 Chakra reading

### Photo-based
- 🤚 Palm reading
- ✨ Aura reading

### Personal
- 🧠 "Read me" — AI psychological portrait

### Gamification
- 🔥 Daily streaks → bonus readings
- 🃏 Card collection (collect all 78)
- 🏅 Achievements
- 📊 Monthly review

### Growth
- 👥 Referral system
- 📤 Share beautiful reading cards
- 📺 TG channel with daily card
- 🎬 TikTok content generation

## Setup

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Copy env
cp .env.example .env
# Fill in your values

# Dev
npm run dev

# Set webhook (once deployed)
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/webhook"
```

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── reading/    — Generate AI reading
│   │   ├── webhook/    — Telegram bot webhook
│   │   ├── payment/    — Stars payment
│   │   └── user/       — Auth & user management
│   ├── layout.tsx
│   └── page.tsx        — Mini App entry point
├── components/
│   ├── cards/          — Tarot card components
│   ├── layout/         — Screen components
│   └── ui/             — Shared UI
├── data/
│   ├── tarot-cards.ts  — Full 78-card deck
│   └── spreads.ts      — All spread configs
├── lib/
│   ├── grok.ts         — xAI API client + prompts
│   ├── telegram.ts     — TG Bot & Mini App utils
│   ├── db.ts           — Prisma client
│   └── user-limits.ts  — Free tier & subscription logic
├── store/
│   └── app-store.ts    — Zustand state
└── i18n/
    └── messages/       — RU/UK translations
```
