# ⚡ Простая инструкция: Сборка в папку dist для FileZilla

## ✅ Что настроено

1. ✅ **next.config.js** - добавлен `output: 'standalone'` (standalone сборка)
2. ✅ **scripts/create-dist.js** - скрипт для создания папки dist
3. ✅ **package.json** - добавлена команда `npm run build:dist`

---

## 🚀 Как использовать

### Шаг 1: Собрать проект в папку dist

**Выполните в PowerShell:**

```powershell
# Установить переменную окружения (если еще не установлена)
$env:DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/db1?sslmode=require"

# Собрать проект в папку dist
npm run build:dist
```

**Это создаст папку `dist` с готовыми файлами для деплоя!**

---

### Шаг 2: Загрузить на сервер через FileZilla

1. **Откройте FileZilla**
2. **Подключитесь к вашему серверу** (FTP/SFTP)
3. **Перейдите в папку на сервере** (например: `/var/www/tashi-ani` или `public_html`)
4. **Загрузите ВСЕ содержимое папки `dist`** на сервер
   - Выделите все файлы и папки в `dist`
   - Перетащите на сервер через FileZilla

---

### Шаг 3: Настроить на сервере

**После загрузки выполните через SSH:**

```bash
# 1. Перейти в папку проекта
cd /path/to/project

# 2. Создать файл .env
cp .env.example .env
nano .env  # Заполните DATABASE_URL и другие переменные

# 3. Применить миграции Prisma
npx prisma migrate deploy

# 4. Запустить через PM2
npm install -g pm2
pm2 start server.js --name tashi-ani
pm2 save
```

---

## 📁 Что будет в папке dist

После выполнения `npm run build:dist`:

```
dist/
├── server.js              # Точка входа приложения (Next.js сервер)
├── .next/                 # Собранное Next.js приложение
├── node_modules/          # Необходимые зависимости (уже включены в standalone)
├── public/                # Публичные файлы (uploads, images и т.д.)
├── prisma/                # Prisma schema и миграции
├── package.json           # Конфигурация проекта
├── .env.example          # Пример файла окружения
└── README.md             # Инструкция по деплою
```

---

## ⚠️ ВАЖНО

### Требования к серверу:

- ✅ **Node.js** (версия 18 или выше)
- ✅ **PostgreSQL** (или доступ к reg.ru кластеру)
- ✅ **npm** (для Prisma миграций)
- ✅ **SSH доступ** (для настройки)

### Что нужно на сервере:

1. **Файл .env** - переменные окружения
2. **Миграции Prisma** - применить через `npx prisma migrate deploy`
3. **Запуск через PM2 или systemd** - для постоянной работы

---

## 🔄 Обновление проекта

**Когда нужно обновить:**

1. **Локально:**
   ```powershell
   npm run build:dist
   ```

2. **Загрузить новую папку dist** через FileZilla

3. **На сервере:**
   ```bash
   cd /path/to/project
   npx prisma migrate deploy  # Если есть новые миграции
   pm2 restart tashi-ani      # Перезапустить приложение
   ```

---

**Готово! Выполните `npm run build:dist` и загрузите файлы на сервер!**
