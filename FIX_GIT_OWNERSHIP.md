# 🔧 Исправление ошибки Git "dubious ownership"

## Проблема
При выполнении `git pull origin master` возникает ошибка:
```
fatal: detected dubious ownership in repository at '/var/www/tashi-ani'
```

## ✅ Решение

### Шаг 1: Добавьте директорию в безопасные для Git
```bash
git config --global --add safe.directory /var/www/tashi-ani
```

### Шаг 2: Теперь попробуйте снова обновить код
```bash
git pull origin master
```

### Шаг 3: Соберите проект
```bash
npm run build
```

### Шаг 4: Перезапустите приложение
```bash
pm2 restart tashi-ani
```

## 📝 Быстрая команда (всё сразу)

```bash
git config --global --add safe.directory /var/www/tashi-ani && git pull origin master && npm run build && pm2 restart tashi-ani
```

## 🔍 Альтернативное решение (если первое не помогло)

Если проблема сохраняется, можно исправить права доступа:

```bash
# Установите правильного владельца
chown -R root:root /var/www/tashi-ani

# Или если используется другой пользователь
chown -R www-data:www-data /var/www/tashi-ani
```

Но обычно достаточно первой команды с `git config`.

