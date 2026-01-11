<?php
// Файл конфигурации для PHP API
// ВАЖНО: Этот файл для локального тестирования
// На продакшене используйте безопасные значения!

// Строка подключения к базе данных MySQL на reg.ru хостинге
// Формат: mysql://user:password@host:port/database
// ВАЖНО: localhost работает только на самом хостинге reg.ru!
// Для локального тестирования нужно использовать внешний хост (если доступен)
define('DATABASE_URL', 'mysql://u3269198_default:Gdv2210974!!!@localhost:3306/u3269198_default');

// Секретный ключ для JWT токенов (минимум 32 символа)
// ВАЖНО: На продакшене используйте надежный случайный ключ!
define('JWT_SECRET', 'tashi-ani-secret-key-for-development-only-change-in-production-12345');

// Email и пароль мастер-админа (для создания первого админа)
define('MASTER_ADMIN_EMAIL', 'admin@tashi-ani.ru');
define('MASTER_ADMIN_PASSWORD', 'admin123'); // ВАЖНО: Измените на продакшене!

// Настройки SMTP для отправки email
// Для локального тестирования можно оставить пустым (будет использоваться mail())
define('EMAIL_USER', '');
define('EMAIL_PASS', '');
define('EMAIL_HOST', '');
define('EMAIL_PORT', 587);
define('EMAIL_SECURE', 'tls');
define('EMAIL_FROM', 'no-reply@tashi-ani.ru');
define('EMAIL_FROM_NAME', 'Tashi Ani');

// URL вашего сайта (для ссылок в письмах)
define('NEXTAUTH_URL', 'http://localhost:8000');

// Режим окружения (production/development)
define('NODE_ENV', 'development');
?>
