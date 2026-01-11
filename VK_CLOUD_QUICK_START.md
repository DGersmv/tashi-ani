# ⚡ Быстрый старт: VK Cloud с PostgreSQL

Краткая инструкция для быстрого развёртывания проекта на VK Cloud с Managed PostgreSQL.

## 🎯 Что нужно сделать

### 1. Выберите вариант PostgreSQL

#### ⚠️ Вариант А: Managed PostgreSQL (дорого!)

**Стоимость:** ~5000₽/месяц даже за минимальную конфигурацию

Если нужен Managed PostgreSQL:
1. Зайдите на https://mcs.mail.ru
2. **Базы данных** → **Создать базу данных**
3. Выберите **PostgreSQL** (версия 15 или 16)
4. Выберите минимальную конфигурацию
5. Создайте **сильный пароль** (минимум 16 символов)
6. Включите **публичный доступ**
7. Нажмите **Создать**

#### ✅ Вариант Б: PostgreSQL на сервере (рекомендуется!)

**Стоимость:** 0₽ дополнительно (используете ресурсы сервера)

**Установите PostgreSQL прямо на ваш сервер:**
```bash
# На сервере выполните:
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_ПАРОЛЬ';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"
```

**Подробная инструкция:** [VK_CLOUD_POSTGRESQL_ALTERNATIVE.md](./VK_CLOUD_POSTGRESQL_ALTERNATIVE.md)

💡 **Рекомендация:** Используйте вариант Б - это бесплатно и проще!

### 2. Получить строку подключения

#### Если выбрали Managed PostgreSQL:
1. Откройте инстанс → **Подключение**
2. Скопируйте строку подключения:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

#### Если установили на сервер:
Используйте:
```
postgresql://tashi_ani_user:ВАШ_ПАРОЛЬ@localhost:5432/tashi_ani_prod
```

### 3. Настроить сервер

На вашем сервере VK Cloud:

```bash
# 1. Обновите .env.local
nano .env.local

# Вставьте:
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="ваш_секретный_ключ_минимум_32_символа"
MASTER_ADMIN_EMAIL="admin@227.info"
MASTER_ADMIN_PASSWORD="ваш_пароль"
EMAIL_USER="user@tashi-ani.ru"
EMAIL_PASS="ваш_пароль_email"
NEXTAUTH_URL="https://tashi-ani.ru"
NODE_ENV="production"

# 2. Установите PostgreSQL клиент
sudo apt install -y postgresql-client

# 3. Примените миграции
npx prisma generate
npx prisma migrate deploy

# 4. Если есть данные в SQLite - мигрируйте их
npm run db:migrate-data

# 5. Пересоберите проект
npm run build

# 6. Перезапустите
pm2 restart tashi-ani
```

## ✅ Готово!

Ваш проект теперь использует PostgreSQL от VK Cloud.

## 📚 Подробная документация

- ✅ **Рекомендуется:** [VK_CLOUD_POSTGRESQL_ALTERNATIVE.md](./VK_CLOUD_POSTGRESQL_ALTERNATIVE.md) - установка на сервер (бесплатно!)
- Managed PostgreSQL: [VK_CLOUD_DATABASE_MIGRATION.md](./VK_CLOUD_DATABASE_MIGRATION.md)
- Настройка сервера: [VK_CLOUD_SETUP.md](./VK_CLOUD_SETUP.md)
- 💰 Оптимизация стоимости: [VK_CLOUD_COST_OPTIMIZATION.md](./VK_CLOUD_COST_OPTIMIZATION.md)

## 🆘 Проблемы?

**Не могу подключиться:**
- Проверьте firewall rules в VK Cloud
- Убедитесь что публичный доступ включён
- Проверьте строку подключения

**Ошибка миграции:**
- Убедитесь что миграции применены: `npx prisma migrate deploy`
- Проверьте что Prisma schema использует PostgreSQL

**Медленно работает:**
- Сначала оптимизируйте запросы и добавьте индексы
- Только потом увеличивайте конфигурацию
- См. [VK_CLOUD_COST_OPTIMIZATION.md](./VK_CLOUD_COST_OPTIMIZATION.md)

**Слишком дорого:**
- ✅ **Решение:** Установите PostgreSQL на сервер (бесплатно!)
- См. [VK_CLOUD_POSTGRESQL_ALTERNATIVE.md](./VK_CLOUD_POSTGRESQL_ALTERNATIVE.md)
- Экономия: ~5000₽/месяц! 💰
