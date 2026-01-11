# 📦 Инструкция: Сборка в папку dist для FileZilla

## ✅ Что сделано

1. ✅ Обновлен `next.config.js` - добавлен `output: 'standalone'`
2. ✅ Создан скрипт `scripts/create-dist.js` для создания папки dist
3. ✅ Добавлена команда `npm run build:dist` в package.json

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

**После загрузки на сервер выполните через SSH:**

```bash
# 1. Перейти в папку проекта
cd /path/to/project

# 2. Создать файл .env (скопировать .env.example и заполнить)
cp .env.example .env
nano .env  # или используйте редактор

# 3. Установить зависимости
npm install

# 4. Применить миграции Prisma
npx prisma migrate deploy

# 5. Запустить приложение
npm start
```

**Или используйте PM2 (рекомендуется):**

```bash
# Установить PM2 (если еще не установлен)
npm install -g pm2

# Запустить через PM2
cd /path/to/project
pm2 start standalone/server.js --name tashi-ani
pm2 save
pm2 startup  # Настроить автозапуск
```

---

## 📁 Структура папки dist

После сборки в папке `dist` будет:

```
dist/
├── standalone/          # Standalone Next.js сервер
├── .next/              # Статические файлы Next.js
├── public/             # Публичные файлы (uploads, images и т.д.)
├── prisma/             # Prisma schema и миграции
├── package.json        # Зависимости проекта
├── package-lock.json   # Lock файл
├── .env.example        # Пример файла окружения
└── README.md           # Инструкция по деплою
```

---

## ⚠️ ВАЖНО

### Требования к серверу:

- ✅ **Node.js** (версия 18 или выше)
- ✅ **PostgreSQL** (или доступ к внешнему кластеру reg.ru)
- ✅ **npm** или **yarn**
- ✅ **Доступ через SSH** (для установки и запуска)

### Что нужно настроить на сервере:

1. **Файл .env** - переменные окружения (DATABASE_URL и др.)
2. **Зависимости** - `npm install` (или зависимости уже включены)
3. **Миграции Prisma** - `npx prisma migrate deploy`
4. **Запуск приложения** - через `npm start` или PM2

---

## 🔄 Обновление проекта на сервере

**Когда нужно обновить проект:**

1. **Локально:**
   ```powershell
   npm run build:dist
   ```

2. **Загрузить новую папку dist** через FileZilla (перезаписать старые файлы)

3. **На сервере:**
   ```bash
   cd /path/to/project
   npm install  # Если зависимости изменились
   npx prisma migrate deploy  # Если есть новые миграции
   pm2 restart tashi-ani  # Перезапустить приложение
   ```

---

## 📝 Настройка веб-сервера (nginx/apache)

**Если используете nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Если используете apache:**

Добавьте в конфигурацию виртуального хоста:
```apache
ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/
```

---

## ✅ Готово!

После выполнения всех шагов ваш проект будет работать на сервере!

**Следующий шаг:** Выполните `npm run build:dist` и загрузите файлы на сервер!
