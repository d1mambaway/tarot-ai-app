# Tarot App — Status

## ✅ Done
- [x] 3 languages (RU/UK/EN) auto-detect from TG language_code
- [x] All UI components translated (Home, Spread, Reading, History, Profile, Collection, Shop, Loading, ManaModal, BottomNav)
- [x] English card names + keywords for all 78 cards in tarot-cards.ts
- [x] Starting mana = 200
- [x] Only Card of Day free, all others min 50 mana
- [x] Admin panel for @d1mamba (list users, grant/set mana, toggle admin)
- [x] Stars payment API (4 mana packs)
- [x] Webhook rewritten (3 languages, payment fulfillment)
- [x] Mana icon transparency
- [x] Prisma schema updated (isAdmin, mana, channelSubBonus fields)
- [x] Prisma client regenerated
- [x] TypeScript: 0 errors
- [x] Build: success

## 🔲 Waiting on user
- [ ] DATABASE_URL (Neon Postgres connection string) → then prisma db push
- [ ] Card images (user generating Major Arcana)

## 🔲 After DATABASE_URL received
- [ ] prisma db push
- [ ] Add DATABASE_URL to Vercel env vars
- [ ] Git commit + push as dimambaway
- [ ] Verify deploy works

## 🔲 Future
- [ ] Upload card images to repo
- [ ] Referral mana bonus (backend)
- [ ] Daily streak mana bonus
- [ ] Photo readings (palm, aura) — "coming soon"
- [ ] Design polish
