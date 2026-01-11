# Деплой проекта на PHP хостинг

## 📦 Файлы для загрузки на сервер

1. Загрузите ВСЕ файлы из этой папки на сервер через FileZilla
2. На сервере должен быть установлен PHP 7.4+ и MySQL расширение (pdo_mysql)
3. На сервере должна быть доступна БД MySQL (на reg.ru хостинге)

## 🚀 После загрузки на сервер:

### Шаг 1: Создать файл config.php

Если config.php нет, скопируйте config.example.php в config.php и заполните:
```php
<?php
define('DATABASE_URL', 'mysql://u3269198_default:ПАРОЛЬ@localhost:3306/u3269198_default');
define('MASTER_ADMIN_EMAIL', 'admin@tashi-ani.ru');
define('MASTER_ADMIN_PASSWORD', 'ваш-пароль');
define('JWT_SECRET', 'ваш-секретный-ключ-минимум-32-символа');
define('EMAIL_USER', 'admin@tashi-ani.ru');
define('EMAIL_PASS', 'пароль-email');
define('EMAIL_HOST', 'smtp.example.com');
define('EMAIL_PORT', 465);
define('EMAIL_FROM', 'admin@tashi-ani.ru');
define('EMAIL_FROM_NAME', 'Tashi Ani');
?>
```

### Шаг 2: Проверить права доступа

- Папка public/uploads/ должна быть доступна для записи (права 755)
- Все .php файлы должны иметь права 644
- .htaccess должен работать (mod_rewrite включен)

### Шаг 3: Проверить работу API

Откройте в браузере:
```
https://your-domain.com/api/user/profile.php?email=test@example.com
```

Должен вернуться JSON ответ.

## ⚠️ ВАЖНО

- PHP должен поддерживать PDO MySQL расширение (pdo_mysql)
- Проверьте что .htaccess работает (если нет - используйте nginx конфигурацию)
- Все API routes теперь работают через PHP (без Node.js)
- База данных MySQL должна быть создана на reg.ru хостинге
- Frontend - статический экспорт Next.js (не требует Node.js)

## 🔧 Настройка nginx (если не Apache)

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api {
    try_files $uri $uri.php$is_args$args;
}
```
