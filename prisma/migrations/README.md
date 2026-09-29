# Миграции

До этого момента схема применялась командой `prisma db push --accept-data-loss`
прямо в билде на Vercel — то есть каждый деплой молча менял прод-базу и имел
право удалить колонку с данными. Теперь схема версионируется миграциями.

## Разовая процедура для существующей (прод) базы — baseline

База уже содержит все таблицы, поэтому `migrate deploy` нужно один раз
«убедить», что стартовая миграция уже применена:

```bash
export DATABASE_URL=...        # прод-база
npx prisma migrate resolve --applied 0_init
npx prisma migrate deploy      # с этого момента применяет только новое
```

Проверить, что дрейфа нет:

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
```

Пустой вывод = база совпадает со схемой.

## Дальше

- Новая схема: `npx prisma migrate dev --name <что_меняем>` локально, файл миграции коммитим.
- Прод: Vercel запускает `vercel-build` = `prisma migrate deploy && next build`.
  Применяются только новые, ещё не применённые миграции (они аддитивные).
  Если миграция не прошла — сборка падает и Vercel оставляет прошлую рабочую
  версию, так что новый код никогда не выходит без своей схемы.
- `db push` по-прежнему не используется: билд не может удалить колонку с данными.
- Нужны переменные `DATABASE_URL` и `DATABASE_URL_UNPOOLED` в Vercel.
