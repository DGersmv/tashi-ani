# 📊 База данных MySQL

## 🚀 Быстрый старт

### 1. Создание таблиц

Откройте файл `mysql-schema.sql` в phpMyAdmin или выполните через консоль:

```bash
mysql -u u3269198_default -p u3269198_default < mysql-schema.sql
```

Или через phpMyAdmin:
1. Войдите в phpMyAdmin на reg.ru
2. Выберите базу данных `u3269198_default`
3. Перейдите на вкладку "SQL"
4. Скопируйте содержимое `mysql-schema.sql`
5. Нажмите "Выполнить"

### 2. Проверка

После выполнения скрипта проверьте, что все таблицы созданы:

```sql
SHOW TABLES;
```

Должно быть 15 таблиц:
- users
- objects
- projects
- project_stages
- photo_folders
- photos
- panoramas
- panorama_comments
- photo_comments
- documents
- messages
- verification_codes
- bim_models
- bim_model_comments

## 📋 Структура

Все таблицы созданы с:
- ✅ Правильными типами данных для MySQL
- ✅ Внешними ключами (FOREIGN KEY)
- ✅ Индексами для оптимизации
- ✅ Кодировкой utf8mb4 для поддержки эмодзи
- ✅ Автоматическим обновлением `updated_at`

## ⚠️ Важно

- Скрипт использует `CREATE TABLE IF NOT EXISTS` - безопасно выполнять несколько раз
- Если нужно пересоздать таблицы, раскомментируйте блок `DROP TABLE` в начале файла
- **ВНИМАНИЕ:** DROP TABLE удалит все данные!

## 🔄 Миграция данных

Если у вас есть данные в старой БД (SQLite или PostgreSQL), нужно будет создать скрипт миграции данных.
