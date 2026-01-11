# ⚡ Быстрый старт: Создание базы данных на reg.ru

## 📋 Ваши данные

**Кластер:** tashi-ani-db (PostgreSQL 17)
- **Хост:** 79.174.89.232
- **Порт:** 15555
- **Логин:** admin
- **Пароль:** Gdv2210974! ⚠️

---

## 🚀 Быстрый способ (через командную строку)

### Шаг 1: Установить PostgreSQL клиент (если нет)

**Windows:**

**Вариант А: Полная установка PostgreSQL (рекомендуется)**
1. Скачать PostgreSQL: https://www.postgresql.org/download/windows/
2. Установить (выбрать все компоненты или хотя бы "Command Line Tools")
3. После установки проверить: `psql --version`

**Вариант Б: Онлайн инструменты (без установки)**
- Использовать веб-интерфейс reg.ru (если доступен)
- Или DBeaver: https://dbeaver.io/download/

**Подробнее:** см. `POSTGRESQL_CLIENT_SETUP.md`

### Шаг 2: Подключиться к кластеру

Откройте командную строку (cmd) или PowerShell:

```bash
# Установить переменную окружения с паролем (Windows)
set PGPASSWORD=Gdv2210974!

# Подключиться
psql -h 79.174.89.232 -p 15555 -U admin -d postgres
```

**Или в PowerShell:**
```powershell
$env:PGPASSWORD="Gdv2210974!"
psql -h 79.174.89.232 -p 15555 -U admin -d postgres
```

### Шаг 3: Создать базу данных

В psql выполните:

```sql
CREATE DATABASE tashi_ani_prod;
```

### Шаг 4: Выдать права (если нужно)

```sql
-- Подключиться к новой базе
\c tashi_ani_prod

-- Выдать права на схему
GRANT ALL ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
```

### Шаг 5: Проверить создание

```sql
-- Вернуться к postgres
\c postgres

-- Проверить список баз
\l

-- Должна быть видна tashi_ani_prod
```

### Шаг 6: Выйти

```sql
\q
```

---

## ✅ Готово!

**Ваша строка подключения:**
```
DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/tashi_ani_prod?sslmode=require"
```

**⚠️ ВАЖНО:** 
- Используйте эту строку только в `.env.local`
- Никогда не коммитьте в git!
- Храните пароль в безопасном месте

---

## 📚 Подробная инструкция

Если что-то не понятно или возникли проблемы, см. подробную инструкцию:
- `CREATE_POSTGRESQL_DB_REG_RU.md` - полная инструкция для новичков

---

## 🆘 Если не работает

1. Проверьте что кластер запущен в панели reg.ru
2. Проверьте правильность хоста и порта
3. Проверьте логин и пароль
4. Попробуйте через веб-интерфейс reg.ru (если доступен)
5. См. раздел "Решение проблем" в `CREATE_POSTGRESQL_DB_REG_RU.md`
