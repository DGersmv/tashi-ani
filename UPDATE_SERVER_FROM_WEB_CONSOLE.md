# 🚀 Обновление кода на сервере через веб-консоль

## После того как код отправлен в GitHub

Выполните эти команды в **веб-консоли reg.ru**:

### Шаг 1: Перейдите в директорию проекта
```bash
cd /var/www/tashi-ani
```

### Шаг 2: Обновите код с GitHub
```bash
git pull origin master
```

### Шаг 3: Установите зависимости (если нужно)
```bash
npm install
```

### Шаг 4: Соберите проект
```bash
npm run build
```

### Шаг 5: Перезапустите приложение
```bash
pm2 restart tashi-ani
```

### Шаг 6: Проверьте логи
```bash
pm2 logs tashi-ani --lines 50
```

## ✅ Быстрая команда (всё сразу)

```bash
cd /var/www/tashi-ani && git pull origin master && npm run build && pm2 restart tashi-ani
```

## 🔍 Если есть ошибки при сборке

### Ошибка: "Cannot find module"
```bash
npm install
npm run build
pm2 restart tashi-ani
```

### Ошибка: "JWT_SECRET is not defined"
```bash
# Проверьте .env.local
cat .env.local

# Если нет JWT_SECRET, добавьте
nano .env.local
```

Добавьте строку:
```
JWT_SECRET="your-super-secret-jwt-key-change-this"
```

Затем:
```bash
pm2 restart tashi-ani --update-env
```

## 📝 После обновления

1. Проверьте сайт: https://tashi-ani.ru
2. Попробуйте войти в кабинет
3. Откройте консоль браузера (F12) и проверьте, нет ли ошибок
4. Если ошибка 403 сохраняется, проверьте логи: `pm2 logs tashi-ani --lines 100`

