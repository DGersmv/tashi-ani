# 🔧 Исправление ошибки 400 на статических файлах Next.js

## Проблема
После обновления кода сайт не работает, ошибки:
```
GET https://tashi-ani.ru/_next/static/css/... 400 (Bad Request)
GET https://tashi-ani.ru/_next/static/chunks/... 400 (Bad Request)
```

## ✅ Решение

### Шаг 1: Проверьте статус приложения
В веб-консоли:
```bash
cd /var/www/tashi-ani
pm2 status
```

### Шаг 2: Проверьте логи
```bash
pm2 logs tashi-ani --lines 100 --err
```

### Шаг 3: Удалите старую сборку и пересоберите
```bash
# Удалите директорию .next
rm -rf .next

# Пересоберите проект
npm run build
```

### Шаг 4: Проверьте права доступа
```bash
# Установите правильные права
chown -R root:root /var/www/tashi-ani
chmod -R 755 /var/www/tashi-ani

# Особенно важно для .next
chmod -R 755 .next
```

### Шаг 5: Перезапустите приложение
```bash
pm2 restart tashi-ani
```

### Шаг 6: Проверьте логи после перезапуска
```bash
pm2 logs tashi-ani --lines 50
```

## 🔍 Альтернативное решение: Откат к предыдущей версии

Если ничего не помогает, можно откатиться:

```bash
cd /var/www/tashi-ani
git log --oneline -5
# Найдите хеш коммита до обновления (например, 5a0bd0a)
git reset --hard 5a0bd0a
npm run build
pm2 restart tashi-ani
```

## 📝 Быстрые команды (всё сразу)

```bash
cd /var/www/tashi-ani && rm -rf .next && npm run build && chown -R root:root .next && chmod -R 755 .next && pm2 restart tashi-ani
```

## 🔍 Проверка Nginx (если используется)

Если используется Nginx, проверьте конфигурацию:
```bash
cat /etc/nginx/sites-available/tashi-ani.ru
```

Убедитесь, что есть правильная настройка для статических файлов:
```nginx
location /_next/static {
    alias /var/www/tashi-ani/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

## ✅ После исправления

1. Очистите кэш браузера (Ctrl+Shift+Delete)
2. Попробуйте открыть сайт снова
3. Проверьте консоль браузера (F12) на ошибки

