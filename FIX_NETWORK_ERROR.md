# 🔧 Исправление ошибки "нет сети" при входе в кабинет

## Проблема
При попытке войти в кабинет появляется сообщение "Ошибка подключения. Проверьте интернет-соединение."

## ✅ Пошаговое решение

### Шаг 1: Подключитесь к серверу
```bash
ssh root@89.104.67.209
```

### Шаг 2: Перейдите в директорию проекта
```bash
cd /var/www/tashi-ani
```

### Шаг 3: Проверьте статус приложения PM2
```bash
pm2 status
```

Если приложение не запущено или показывает ошибку, перезапустите:
```bash
pm2 restart tashi-ani
# или если приложения нет в списке:
pm2 start ecosystem.config.js
pm2 save
```

### Шаг 4: Проверьте логи приложения
```bash
pm2 logs tashi-ani --lines 50
```

Ищите ошибки, связанные с:
- Подключением к базе данных
- JWT_SECRET
- Проблемами с портом 3000

### Шаг 5: Проверьте, что сервер слушает на порту 3000
```bash
netstat -tulpn | grep 3000
# или
ss -tulpn | grep 3000
```

Если порт не слушается, проверьте конфигурацию.

### Шаг 6: Проверьте наличие файла .env.local
```bash
ls -la .env.local
```

Если файла нет, создайте его:
```bash
nano .env.local
```

### Шаг 7: Убедитесь, что в .env.local есть ВСЕ необходимые переменные

Скопируйте и вставьте в файл (замените значения на свои реальные):

```env
# База данных (важно: путь должен быть правильным!)
DATABASE_URL="file:./prisma/dev.db"

# JWT секрет (ОБЯЗАТЕЛЬНО! Должен быть одинаковым везде)
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"

# Мастер-админ
MASTER_ADMIN_EMAIL="2277277@bk.ru"
MASTER_ADMIN_PASSWORD="admin123"

# Email настройки (используйте свои реальные данные)
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"
```

**ВАЖНО:** 
- `JWT_SECRET` должен быть **одинаковым** на сервере и в локальной разработке
- `DATABASE_URL` должен указывать на правильный путь к базе данных
- Если используете SQLite, путь должен быть `file:./prisma/dev.db` или `file:./prisma/prod.db`

### Шаг 8: Проверьте, что база данных существует
```bash
ls -la prisma/dev.db
# или
ls -la prisma/prod.db
```

Если базы данных нет, создайте её:
```bash
npx prisma migrate deploy
# или
npx prisma db push
```

### Шаг 9: Проверьте Nginx конфигурацию (если используется)

```bash
nginx -t
```

Убедитесь, что Nginx правильно проксирует запросы на порт 3000.

### Шаг 10: Перезапустите приложение
```bash
pm2 restart tashi-ani
pm2 logs tashi-ani
```

### Шаг 11: Проверьте работу API напрямую
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Если это не работает, значит проблема в самом приложении.

## 🔍 Дополнительная диагностика

### Проверьте переменные окружения в PM2
```bash
pm2 env 0
```

Убедитесь, что все переменные из `.env.local` загружены.

### Если PM2 не загружает .env.local

PM2 может не загружать `.env.local` автоматически. В этом случае:

1. **Вариант 1:** Используйте `dotenv` в `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'tashi-ani',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env.local', // Добавьте эту строку
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

2. **Вариант 2:** Загрузите переменные вручную в `ecosystem.config.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

module.exports = {
  apps: [{
    name: 'tashi-ani',
    script: 'npm',
    args: 'start',
    // ... остальная конфигурация
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      MASTER_ADMIN_EMAIL: process.env.MASTER_ADMIN_EMAIL,
      MASTER_ADMIN_PASSWORD: process.env.MASTER_ADMIN_PASSWORD,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
    }
  }]
}
```

После изменения `ecosystem.config.js`:
```bash
pm2 delete tashi-ani
pm2 start ecosystem.config.js
pm2 save
```

## 🚨 Частые проблемы

1. **Сервер не запущен** - проверьте `pm2 status`
2. **Неправильный путь к базе данных** - проверьте `DATABASE_URL` в `.env.local`
3. **База данных не существует** - создайте её через `prisma migrate deploy`
4. **JWT_SECRET не установлен** - добавьте его в `.env.local`
5. **Порт 3000 занят другим процессом** - проверьте `netstat -tulpn | grep 3000`
6. **Nginx не проксирует запросы** - проверьте конфигурацию Nginx

## ✅ После исправления

1. Перезапустите приложение: `pm2 restart tashi-ani`
2. Проверьте логи: `pm2 logs tashi-ani`
3. Попробуйте войти в кабинет снова
4. Если проблема сохраняется, проверьте консоль браузера (F12) для более детальных ошибок

