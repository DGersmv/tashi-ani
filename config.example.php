<?php
/**
 * Конфигурационный файл
 * Скопируйте в config.php и заполните своими данными
 */

// URL подключения к базе данных PostgreSQL
// Формат: postgresql://user:password@host:port/database?sslmode=require
define('DATABASE_URL', 'postgresql://admin:Gdv2210974!@79.174.89.232:15555/db1?sslmode=require');

// Мастер-админ (для входа по паролю)
define('MASTER_ADMIN_EMAIL', 'admin@tashi-ani.ru');
define('MASTER_ADMIN_PASSWORD', 'ваш-пароль-мастер-админа');

// JWT секретный ключ (используйте случайную строку)
define('JWT_SECRET', 'ваш-секретный-ключ-для-jwt-токенов-минимум-32-символа');

// Настройки email (для отправки кодов верификации)
define('EMAIL_USER', 'admin@tashi-ani.ru');
define('EMAIL_PASS', 'ваш-пароль-email');
define('EMAIL_HOST', 'smtp.example.com');
define('EMAIL_PORT', 465);
define('EMAIL_FROM', 'admin@tashi-ani.ru');
define('EMAIL_FROM_NAME', 'Tashi Ani');

?>
