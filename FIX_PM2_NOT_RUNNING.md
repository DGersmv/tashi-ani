# 🚀 Исправление: Приложение не запущено в PM2

## Проблема
PM2 показывает: `[PM2] [ERROR] Process or Namespace tashi-ani not found`

Это значит, что приложение не запущено. Нужно его запустить.

## ✅ Пошаговое решение

### Шаг 1: Проверьте, что вы в правильной директории
```bash
pwd
```
Должно показать: `/var/www/tashi-ani`

### Шаг 2: Проверьте наличие файла ecosystem.config.js
```bash
ls -la ecosystem.config.js
```

### Шаг 3: Проверьте файл .env.local
```bash
cat .env.local
```

### Шаг 4: Запустите приложение
```bash
pm2 start ecosystem.config.js
```

### Шаг 5: Проверьте статус
```bash
pm2 status
```

### Шаг 6: Посмотрите логи
```bash
pm2 logs tashi-ani --lines 50
```

## 🔧 Если при запуске есть ошибки

### Ошибка: "Cannot find module"
```bash
npm install
pm2 start ecosystem.config.js
```

### Ошибка: "Database connection failed"
```bash
# Проверьте путь к базе данных
ls -la prisma/dev.db

# Если базы нет, создайте
npx prisma migrate deploy
```

### Ошибка: "JWT_SECRET is not defined"
```bash
# Проверьте .env.local
cat .env.local | grep JWT_SECRET

# Если нет, добавьте в .env.local
nano .env.local
```

## 📝 Быстрые команды (скопируйте и выполните по одной)

```bash
cd /var/www/tashi-ani
```

```bash
pm2 start ecosystem.config.js
```

```bash
pm2 status
```

```bash
pm2 logs tashi-ani --lines 30
```

## ✅ После запуска

1. Приложение должно быть в статусе `online`
2. Проверьте сайт: https://tashi-ani.ru
3. Попробуйте войти в кабинет

