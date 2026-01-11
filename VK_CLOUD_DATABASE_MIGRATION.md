# 🗄️ Миграция на VK Cloud Managed PostgreSQL

## 📋 Обзор

Этот документ описывает полную миграцию проекта с SQLite на **VK Cloud Managed PostgreSQL** - управляемый сервис баз данных от VK Cloud.

## ✅ Преимущества Managed PostgreSQL

- ✅ **Автоматические бэкапы** - ежедневные резервные копии
- ✅ **Высокая доступность** - автоматический failover
- ✅ **Масштабируемость** - легко увеличить ресурсы (без потери данных!)
- ✅ **Безопасность** - изоляция сети, SSL соединения
- ✅ **Мониторинг** - встроенные метрики и алерты
- ✅ **Обновления** - автоматические обновления безопасности
- ✅ **Экономия** - платите только за используемые ресурсы (от ~500₽/мес)

## 🚀 Шаг 1: Создание PostgreSQL инстанса в VK Cloud

### 1.1 Вход в панель VK Cloud

1. Зайдите на https://mcs.mail.ru
2. Войдите в свой аккаунт
3. Выберите проект (или создайте новый)

### 1.2 Создание базы данных

1. Перейдите в раздел **"Базы данных"** или **"Databases"**
2. Нажмите **"Создать базу данных"** или **"Create Database"**
3. Выберите **PostgreSQL** (рекомендуется версия 15 или 16)
4. Настройте параметры:

   **Базовая конфигурация:**
   - **Имя инстанса:** `tashi-ani-db` (или другое)
   - **Регион:** выберите ближайший к вашему серверу
   - **Версия PostgreSQL:** 15 или 16
   - **Конфигурация (выберите по бюджету):**
     - **💰 Минимальная (для старта):** 1 CPU, 1GB RAM, 20GB диск (~500-800₽/мес)
       - Подходит для небольших проектов, до 100 пользователей
       - Можно увеличить позже при росте нагрузки
     - **✅ Рекомендуемая (оптимальная):** 1 CPU, 2GB RAM, 20GB диск (~800-1200₽/мес)
       - Хороший баланс цена/производительность
       - Для проектов до 500 пользователей
     - **🚀 Для высокой нагрузки:** 2 CPU, 4GB RAM, 50GB диск (~2000-3000₽/мес)
       - Только если действительно нужна высокая производительность
       - Для проектов с тысячами пользователей
   
   💡 **Важно:** Начните с минимальной конфигурации! В VK Cloud можно легко увеличить ресурсы позже без потери данных.

   **Сеть:**
   - **Публичный доступ:** Включите (если сервер вне VK Cloud)
   - **Или:** Используйте приватную сеть (если сервер в VK Cloud)

   **Безопасность:**
   - **Пароль администратора:** Создайте **СИЛЬНЫЙ** пароль (минимум 16 символов)
   - Сохраните пароль в безопасном месте!

5. Нажмите **"Создать"** или **"Create"**
6. Дождитесь создания инстанса (5-10 минут)

### 1.3 Получение строки подключения

После создания инстанса:

1. Откройте созданный инстанс PostgreSQL
2. Найдите раздел **"Подключение"** или **"Connection"**
3. Скопируйте строку подключения, она будет выглядеть так:

```
postgresql://user:password@host:port/database?sslmode=require
```

**Или получите параметры отдельно:**
- **Host (хост):** `c-xxxxx.rw.mdb.yandexcloud.net` (или IP адрес)
- **Port (порт):** `6432` (обычно)
- **Database (база):** `postgres` (по умолчанию) или создайте новую
- **User (пользователь):** `postgres` (по умолчанию) или создайте нового
- **Password (пароль):** тот, который вы задали при создании

### 1.4 Создание отдельной базы данных (рекомендуется)

1. Подключитесь к PostgreSQL через psql или любой клиент
2. Создайте базу данных для проекта:

```sql
CREATE DATABASE tashi_ani_prod;
```

3. Создайте отдельного пользователя (опционально, но рекомендуется):

```sql
CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_СИЛЬНЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;
```

## 🔧 Шаг 2: Обновление проекта

### 2.1 Обновление Prisma Schema

Prisma schema уже обновлён для PostgreSQL. Проверьте `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.2 Настройка переменных окружения

Обновите `.env.local` на сервере:

```bash
# PostgreSQL от VK Cloud
DATABASE_URL="postgresql://tashi_ani_user:ВАШ_ПАРОЛЬ@c-xxxxx.rw.mdb.yandexcloud.net:6432/tashi_ani_prod?sslmode=require"

# Остальные переменные
JWT_SECRET="ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_МИНИМУМ_32_СИМВОЛА"
MASTER_ADMIN_EMAIL="admin@227.info"
MASTER_ADMIN_PASSWORD="ВАШ_ПАРОЛЬ_АДМИНА"
EMAIL_USER="user@tashi-ani.ru"
EMAIL_PASS="ВАШ_ПАРОЛЬ_EMAIL"
NEXTAUTH_URL="https://tashi-ani.ru"
NODE_ENV="production"
```

**Важно:** 
- Используйте `sslmode=require` для безопасного подключения
- Никогда не коммитьте `.env.local` в git!

### 2.3 Установка PostgreSQL клиента (на сервере)

```bash
# Установите PostgreSQL клиент для миграции данных
sudo apt update
sudo apt install -y postgresql-client

# Проверьте подключение
psql "postgresql://tashi_ani_user:ПАРОЛЬ@c-xxxxx.rw.mdb.yandexcloud.net:6432/tashi_ani_prod?sslmode=require"
```

## 📦 Шаг 3: Миграция данных из SQLite в PostgreSQL

### 3.1 Экспорт данных из SQLite

На сервере, где находится старая SQLite база:

```bash
cd /var/www/tashi-ani

# Создайте резервную копию SQLite
cp prisma/prod.db prisma/prod.db.backup

# Экспортируйте данные в SQL (если нужно)
# Установите sqlite3 если нет
sudo apt install -y sqlite3

# Экспорт схемы
sqlite3 prisma/prod.db .schema > schema_export.sql

# Экспорт данных (опционально, для проверки)
sqlite3 prisma/prod.db .dump > data_export.sql
```

### 3.2 Применение миграций Prisma к PostgreSQL

```bash
# 1. Сгенерируйте Prisma Client для PostgreSQL
npx prisma generate

# 2. Примените все миграции к новой PostgreSQL базе
npx prisma migrate deploy

# Это создаст все таблицы в PostgreSQL согласно схеме
```

### 3.3 Миграция данных (если есть существующие данные)

Если у вас уже есть данные в SQLite, используйте скрипт миграции:

```bash
# Запустите скрипт миграции (см. ниже)
node scripts/migrate-sqlite-to-postgres.js
```

Или вручную через Prisma Studio:

```bash
# Запустите Prisma Studio для старой SQLite базы
DATABASE_URL="file:./prisma/prod.db" npx prisma studio

# И для новой PostgreSQL базы (в другом терминале)
npx prisma studio

# Скопируйте данные вручную через интерфейс
```

## 🔄 Шаг 4: Обновление приложения

### 4.1 Пересборка проекта

```bash
cd /var/www/tashi-ani

# 1. Убедитесь что .env.local обновлён с PostgreSQL URL
nano .env.local

# 2. Сгенерируйте Prisma Client
npx prisma generate

# 3. Пересоберите проект
NODE_OPTIONS="--max-old-space-size=512" npm run build

# 4. Перезапустите через PM2
pm2 restart tashi-ani

# 5. Проверьте логи
pm2 logs tashi-ani --lines 50
```

### 4.2 Проверка работы

```bash
# 1. Проверьте подключение к базе
npx prisma studio
# Откройте http://localhost:5555 в браузере

# 2. Проверьте API endpoints
curl http://localhost:3000/api/health

# 3. Проверьте логи на ошибки
pm2 logs tashi-ani --err
```

## 🔒 Шаг 5: Настройка безопасности

### 5.1 Ограничение доступа к базе данных

В панели VK Cloud:

1. Откройте ваш PostgreSQL инстанс
2. Перейдите в **"Безопасность"** или **"Security"**
3. Настройте **Firewall rules**:
   - Разрешите доступ только с IP вашего сервера
   - Или используйте приватную сеть VK Cloud

### 5.2 Использование SSL

Строка подключения уже включает `sslmode=require`, что обеспечивает:
- Шифрование соединения
- Проверку сертификата сервера

### 5.3 Регулярные бэкапы

VK Cloud автоматически создаёт бэкапы, но вы можете:

1. Включить автоматические бэкапы в настройках инстанса
2. Настроить расписание бэкапов
3. Хранить бэкапы в отдельном хранилище

## 📊 Шаг 6: Мониторинг и оптимизация

### 6.1 Мониторинг в VK Cloud

В панели VK Cloud вы можете отслеживать:
- Использование CPU и RAM
- Использование диска
- Количество подключений
- Запросы в секунду
- Задержки запросов

### 6.2 Оптимизация производительности

```sql
-- Проверьте медленные запросы
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Проверьте размер таблиц
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🆘 Решение проблем

### Проблема: Не могу подключиться к базе

**Решение:**
1. Проверьте что инстанс запущен в VK Cloud
2. Проверьте firewall rules - разрешён ли доступ с вашего IP
3. Проверьте строку подключения (пароль, хост, порт)
4. Проверьте SSL настройки

### Проблема: Ошибка "relation does not exist"

**Решение:**
```bash
# Примените миграции заново
npx prisma migrate deploy

# Или создайте базу данных заново
npx prisma migrate dev
```

### Проблема: Медленные запросы

**Решение:**
1. Увеличьте конфигурацию инстанса в VK Cloud
2. Добавьте индексы в Prisma schema
3. Оптимизируйте запросы в коде

### Проблема: Превышен лимит подключений

**Решение:**
1. Увеличьте `max_connections` в настройках инстанса
2. Используйте connection pooling (PgBouncer)
3. Оптимизируйте код - закрывайте соединения

## 📝 Чеклист миграции

- [ ] Создан PostgreSQL инстанс в VK Cloud
- [ ] Получена строка подключения
- [ ] Создана отдельная база данных для проекта
- [ ] Обновлён `.env.local` с PostgreSQL URL
- [ ] Обновлён Prisma schema (уже сделано)
- [ ] Применены миграции Prisma (`npx prisma migrate deploy`)
- [ ] Мигрированы данные из SQLite (если были)
- [ ] Пересобран проект
- [ ] Перезапущен PM2
- [ ] Проверена работа приложения
- [ ] Настроена безопасность (firewall, SSL)
- [ ] Настроены автоматические бэкапы
- [ ] Протестированы все функции приложения

## 🎯 Следующие шаги

После успешной миграции:

1. **Удалите старую SQLite базу** (после проверки что всё работает):
   ```bash
   # Создайте финальный бэкап
   cp prisma/prod.db prisma/prod.db.final_backup
   
   # Удалите (только после полной проверки!)
   # rm prisma/prod.db
   ```

2. **Настройте мониторинг** - добавьте алерты в VK Cloud

3. **Оптимизируйте производительность** - добавьте индексы, настройте connection pooling

4. **Документируйте** - сохраните строку подключения и пароли в безопасном месте

## 📚 Полезные ссылки

- [Документация VK Cloud Databases](https://mcs.mail.ru/help/databases/)
- [Документация Prisma PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/admin.html)

