# 🔧 Исправление ошибки 403 Forbidden на /api/auth/login

## Проблема
При попытке войти в кабинет получаете ошибку:
```
POST https://tashi-ani.ru/api/auth/login 403 (Forbidden)
```

## ✅ Решение

### Шаг 1: Проверьте логи сервера
В веб-консоли:
```bash
cd /var/www/tashi-ani
pm2 logs tashi-ani --lines 100 --err
```

Ищите ошибки, связанные с:
- `JWT_SECRET`
- `authenticateUser`
- `Database connection`

### Шаг 2: Проверьте переменные окружения
```bash
pm2 env 0 | grep JWT_SECRET
```

Если пусто - переменные не загрузились.

### Шаг 3: Проверьте .env.local
```bash
cat .env.local
```

Убедитесь, что есть `JWT_SECRET`.

### Шаг 4: Перезапустите приложение
```bash
pm2 restart tashi-ani --update-env
```

### Шаг 5: Проверьте, работает ли API локально
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

Если получаете 403 - проблема в коде.
Если получаете другую ошибку - проблема в данных/БД.

### Шаг 6: Проверьте Nginx конфигурацию (если используется)

Если используется Nginx как прокси, проверьте:
```bash
cat /etc/nginx/sites-available/tashi-ani.ru
```

Убедитесь, что нет блокировок для `/api/*`.

### Шаг 7: Обновите код на сервере

Если вы внесли изменения в код (добавили CORS заголовки):
```bash
cd /var/www/tashi-ani
git pull origin master
npm run build
pm2 restart tashi-ani
```

## 🔍 Частые причины 403

1. **JWT_SECRET не установлен** - проверьте `.env.local`
2. **Nginx блокирует запросы** - проверьте конфигурацию Nginx
3. **Проблема с CORS** - добавлены заголовки в код
4. **Next.js не обрабатывает запрос** - проверьте логи

## 📝 Быстрые команды

```bash
cd /var/www/tashi-ani
```

```bash
pm2 logs tashi-ani --lines 50
```

```bash
cat .env.local | grep JWT_SECRET
```

```bash
pm2 restart tashi-ani --update-env
```

```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

