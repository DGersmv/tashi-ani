# 🔧 Восстановление директории .next

## Проблема
После `rm -rf .next` статические файлы не загружаются (400 Bad Request).

## ✅ Решение

### Вариант 1: Проверить, есть ли .next
В веб-консоли:
```bash
cd /var/www/tashi-ani
ls -la .next
```

Если директории нет или она пустая - нужно собрать заново.

### Вариант 2: Собрать с ограничением памяти
```bash
# Установите переменную для ограничения памяти
export NODE_OPTIONS="--max-old-space-size=1024"

# Соберите проект
npm run build
```

### Вариант 3: Создать swap и собрать
```bash
# Создайте swap (если ещё не создан)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Соберите
npm run build
```

### Вариант 4: Проверить Nginx конфигурацию
Если используется Nginx, возможно проблема в конфигурации:
```bash
cat /etc/nginx/sites-available/tashi-ani.ru | grep -A 10 "_next"
```

## 📝 Быстрая команда

```bash
cd /var/www/tashi-ani && ls -la .next 2>&1 || (export NODE_OPTIONS="--max-old-space-size=1024" && npm run build)
```

## 🔍 Проверка

После сборки проверьте:
```bash
ls -la .next/static
```

Должны быть файлы в директории.

