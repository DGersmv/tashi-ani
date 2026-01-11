# ✅ Исправление: Путь к SQLite базе

## ❌ Проблема

Скрипт ищет `prisma/prod.db`, а файл называется `prisma/dev.db`.

## ✅ Решение

**Установить переменную окружения `SQLITE_DATABASE_URL`:**

```powershell
$env:SQLITE_DATABASE_URL="file:./prisma/dev.db"
```

**Затем выполнить миграцию:**

```powershell
npm run db:migrate-data
```

---

## 📝 Полная последовательность команд

```powershell
# 1. Установить переменную для PostgreSQL БД
$env:DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/db1?sslmode=require"

# 2. Установить переменную для SQLite БД
$env:SQLITE_DATABASE_URL="file:./prisma/dev.db"

# 3. Мигрировать данные
npm run db:migrate-data
```

---

**Выполните команды выше - должно заработать!**
