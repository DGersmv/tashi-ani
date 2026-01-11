# 🚀 Установка PostgreSQL на сервер (пошагово)

## ✅ Вы подключены к серверу!

Теперь выполните команды по порядку:

## Шаг 1: Обновите систему

```bash
sudo apt update
```

**⚠️ Если получаете ошибку "Temporary failure resolving":**
- См. [FIX_DNS_PROBLEM.md](./FIX_DNS_PROBLEM.md) - как исправить DNS
- Или попробуйте установить PostgreSQL без обновления (см. ниже)

## Шаг 2: Установите PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

Это займёт 1-2 минуты. Дождитесь завершения.

## Шаг 3: Проверьте что PostgreSQL установлен

```bash
psql --version
```

Должно показать версию, например: `psql (PostgreSQL) 14.x`

## Шаг 4: Создайте базу данных

```bash
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"
```

## Шаг 5: Создайте пользователя

**Замените `ВАШ_СИЛЬНЫЙ_ПАРОЛЬ` на реальный пароль (минимум 16 символов!):**

```bash
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_СИЛЬНЫЙ_ПАРОЛЬ';"
```

**Пример:**
```bash
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'MySuperSecurePassword123!';"
```

## Шаг 6: Дайте права пользователю

```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"
```

## Шаг 7: Проверьте что всё работает

```bash
# Проверьте что база создана
sudo -u postgres psql -c "\l" | grep tashi_ani_prod

# Проверьте что пользователь создан
sudo -u postgres psql -c "\du" | grep tashi_ani_user
```

## Шаг 8: Обновите .env.local

```bash
cd /var/www/tashi-ani
nano .env.local
```

**Найдите строку `DATABASE_URL` и замените на:**

```
DATABASE_URL="postgresql://tashi_ani_user:ВАШ_ПАРОЛЬ@localhost:5432/tashi_ani_prod"
```

**Замените `ВАШ_ПАРОЛЬ` на тот пароль, который вы указали в Шаге 5!**

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Шаг 9: Примените миграции Prisma

```bash
cd /var/www/tashi-ani
npx prisma generate
npx prisma migrate deploy
```

## Шаг 10: Если есть данные в SQLite - мигрируйте их

```bash
npm run db:migrate-data
```

## Шаг 11: Пересоберите проект

```bash
npm run build
```

## Шаг 12: Перезапустите приложение

```bash
pm2 restart tashi-ani
```

## Шаг 13: Проверьте что всё работает

```bash
# Проверьте логи
pm2 logs tashi-ani --lines 20

# Проверьте статус
pm2 status
```

## ✅ Готово!

Ваш проект теперь использует PostgreSQL на сервере!

## 🆘 Если что-то пошло не так

### Ошибка при установке PostgreSQL

**Если проблема с DNS (не может обновить):**

1. Исправьте DNS (см. [FIX_DNS_PROBLEM.md](./FIX_DNS_PROBLEM.md))
2. Или попробуйте установить без обновления:
   ```bash
   sudo apt install -y postgresql postgresql-contrib --allow-unauthenticated
   ```

**Если другая ошибка:**

```bash
# Попробуйте обновить список пакетов
sudo apt update
sudo apt upgrade -y

# Попробуйте установить снова
sudo apt install -y postgresql postgresql-contrib
```

### Ошибка "database already exists"

```bash
# Удалите старую базу (если нужно)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS tashi_ani_prod;"

# Создайте заново
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"
```

### Ошибка "role already exists"

```bash
# Удалите старого пользователя (если нужно)
sudo -u postgres psql -c "DROP USER IF EXISTS tashi_ani_user;"

# Создайте заново
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_ПАРОЛЬ';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"
```

### Не могу подключиться к базе из приложения

1. Проверьте что PostgreSQL запущен:
   ```bash
   sudo systemctl status postgresql
   ```

2. Проверьте строку подключения в `.env.local`:
   ```bash
   cat /var/www/tashi-ani/.env.local | grep DATABASE_URL
   ```

3. Проверьте что пароль правильный (без лишних пробелов, кавычек)

## 📝 Полезные команды

```bash
# Посмотреть размер базы данных
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('tashi_ani_prod'));"

# Подключиться к базе вручную
sudo -u postgres psql -d tashi_ani_prod

# Выйти из psql
\q

# Посмотреть все таблицы
sudo -u postgres psql -d tashi_ani_prod -c "\dt"
```

