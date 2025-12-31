# 🔧 Исправление: Не могу зайти в кабинет (ошибка "нет сети")

## Проблема
Сайт работает, но при попытке войти в кабинет появляется ошибка "нет сети" или "Ошибка подключения".

## ✅ Диагностика и исправление

### Шаг 1: Проверьте логи приложения
В веб-консоли выполните:
```bash
cd /var/www/tashi-ani
pm2 logs tashi-ani --lines 100 --err
```

Ищите ошибки, связанные с:
- `/api/auth/login`
- `JWT_SECRET`
- `DATABASE_URL`
- `authenticateUser`

### Шаг 2: Проверьте, работает ли API endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

Если получаете ошибку или пустой ответ - проблема в API.

### Шаг 3: Проверьте переменные окружения
```bash
pm2 env 0 | grep -E "JWT_SECRET|DATABASE_URL|MASTER_ADMIN"
```

Если переменных нет - они не загрузились из .env.local

### Шаг 4: Проверьте файл .env.local
```bash
cat .env.local
```

Убедитесь, что есть:
- `JWT_SECRET` (обязательно!)
- `DATABASE_URL`
- `MASTER_ADMIN_EMAIL`
- `MASTER_ADMIN_PASSWORD`

### Шаг 5: Проверьте базу данных
```bash
ls -la prisma/dev.db
```

Если файла нет:
```bash
npx prisma migrate deploy
```

### Шаг 6: Перезапустите приложение с обновлением переменных
```bash
pm2 restart tashi-ani --update-env
```

Или если приложение не запущено:
```bash
pm2 delete tashi-ani
pm2 start ecosystem.config.js
```

### Шаг 7: Проверьте логи после перезапуска
```bash
pm2 logs tashi-ani --lines 50
```

## 🔍 Частые проблемы и решения

### Проблема 1: JWT_SECRET не установлен
**Симптомы:** Ошибка "JWT_SECRET is not defined" в логах

**Решение:**
```bash
# Откройте .env.local
nano .env.local

# Добавьте строку (если её нет):
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"

# Сохраните (Ctrl+X, Y, Enter)

# Перезапустите
pm2 restart tashi-ani --update-env
```

### Проблема 2: База данных не найдена
**Симптомы:** Ошибка "Database connection failed" или "Cannot find database"

**Решение:**
```bash
# Проверьте путь в .env.local
cat .env.local | grep DATABASE_URL

# Должно быть: DATABASE_URL="file:./prisma/dev.db"
# Если путь другой, исправьте

# Создайте базу если её нет
npx prisma migrate deploy

# Перезапустите
pm2 restart tashi-ani --update-env
```

### Проблема 3: Пользователь не существует в базе
**Симптомы:** "Неверный email или пароль" даже с правильными данными

**Решение:**
```bash
# Создайте/обновите админа
node create-admin-user.js

# Проверьте результат
pm2 logs tashi-ani --lines 20
```

### Проблема 4: PM2 не загружает .env.local
**Симптомы:** Переменные окружения пустые в `pm2 env 0`

**Решение:**
```bash
# Удалите и перезапустите приложение
pm2 delete tashi-ani
pm2 start ecosystem.config.js

# Проверьте переменные
pm2 env 0
```

## 📝 Быстрые команды для диагностики

Выполните по порядку в веб-консоли:

```bash
cd /var/www/tashi-ani
```

```bash
pm2 logs tashi-ani --lines 100 --err
```

```bash
cat .env.local
```

```bash
pm2 env 0 | grep JWT_SECRET
```

```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

```bash
pm2 restart tashi-ani --update-env
```

## ✅ После исправления

1. Перезапустите приложение
2. Проверьте логи на ошибки
3. Попробуйте войти в кабинет на сайте
4. Откройте консоль браузера (F12) и посмотрите на ошибки сети

