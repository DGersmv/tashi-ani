/**
 * Скрипт для создания папки dist с файлами для деплоя
 * 
 * Использование: npm run build:dist
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');

// Очистить старую папку dist если существует
if (fs.existsSync(distDir)) {
  console.log('🗑️  Удаление старой папки dist...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Создать папку dist
fs.mkdirSync(distDir, { recursive: true });

console.log('📦 Создание папки dist для деплоя...\n');

// Функция для копирования файла или папки
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

// Этот блок больше не нужен, т.к. сборка происходит в build-without-api.js

// Проверить что Next.js статический экспорт существует
const outPath = path.join(rootDir, 'out');
if (!fs.existsSync(outPath)) {
  console.error('❌ Ошибка: Папка out не найдена!');
  console.error('   Сначала выполните: npm run build');
  console.error('   (Next.js должен быть настроен на output: "export")');
  
// Восстановление API папки больше не нужно
  
  process.exit(1);
}

// Копировать статический экспорт Next.js (папка out)
console.log('✅ Копирование статического экспорта Next.js (out)...');
const outFiles = fs.readdirSync(outPath);
outFiles.forEach(file => {
  copyRecursive(path.join(outPath, file), path.join(distDir, file));
});

// Копировать public
const publicPath = path.join(rootDir, 'public');
const publicDestPath = path.join(distDir, 'public');
if (fs.existsSync(publicPath)) {
  console.log('✅ Копирование public...');
  copyRecursive(publicPath, publicDestPath);
} else {
  console.warn('⚠️  public не найден');
}

// Копировать PHP API
const phpApiPath = path.join(rootDir, 'api');
const apiDestPath = path.join(distDir, 'api');
if (fs.existsSync(phpApiPath)) {
  console.log('✅ Копирование PHP API...');
  copyRecursive(phpApiPath, apiDestPath);
} else {
  console.warn('⚠️  api не найден');
}

// Копировать config.php (если есть)
const configPath = path.join(rootDir, 'config.php');
const configDestPath = path.join(distDir, 'config.php');
if (fs.existsSync(configPath)) {
  fs.copyFileSync(configPath, configDestPath);
  console.log('✅ Копирование config.php');
} else {
  // Если config.php нет, копируем config.example.php
  const configExamplePath = path.join(rootDir, 'config.example.php');
  const configExampleDestPath = path.join(distDir, 'config.example.php');
  if (fs.existsSync(configExamplePath)) {
    fs.copyFileSync(configExamplePath, configExampleDestPath);
    console.log('✅ Копирование config.example.php (создайте config.php на сервере)');
  }
}

// Создать .htaccess для перенаправления API на PHP и SPA routing
const htaccess = `# Включить PHP
AddHandler application/x-httpd-php .php

# Включить mod_rewrite
RewriteEngine On
RewriteBase /

# API routes - перенаправление на PHP файлы
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1.php [L,QSA]

# Если запрашивается файл .php напрямую - отдаём его
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} \.php$
RewriteRule ^(.*)$ - [L]

# Для статических файлов (из Next.js экспорта)
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^(.*)$ - [L]

# SPA routing - все остальные запросы на index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
`;

fs.writeFileSync(path.join(distDir, '.htaccess'), htaccess);
console.log('✅ Создан .htaccess');

// Создать README для деплоя
const readme = `# Деплой проекта на PHP хостинг

## 📦 Файлы для загрузки на сервер

1. Загрузите ВСЕ файлы из этой папки на сервер через FileZilla
2. На сервере должен быть установлен PHP 7.4+ и MySQL расширение (pdo_mysql)
3. На сервере должна быть доступна БД MySQL (на reg.ru хостинге)

## 🚀 После загрузки на сервер:

### Шаг 1: Создать файл config.php

Если config.php нет, скопируйте config.example.php в config.php и заполните:
\`\`\`php
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
\`\`\`

### Шаг 2: Проверить права доступа

- Папка public/uploads/ должна быть доступна для записи (права 755)
- Все .php файлы должны иметь права 644
- .htaccess должен работать (mod_rewrite включен)

### Шаг 3: Проверить работу API

Откройте в браузере:
\`\`\`
https://your-domain.com/api/user/profile.php?email=test@example.com
\`\`\`

Должен вернуться JSON ответ.

## ⚠️ ВАЖНО

- PHP должен поддерживать PDO MySQL расширение (pdo_mysql)
- Проверьте что .htaccess работает (если нет - используйте nginx конфигурацию)
- Все API routes теперь работают через PHP (без Node.js)
- База данных MySQL должна быть создана на reg.ru хостинге
- Frontend - статический экспорт Next.js (не требует Node.js)

## 🔧 Настройка nginx (если не Apache)

\`\`\`nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api {
    try_files $uri $uri.php$is_args$args;
}
\`\`\`
`;

fs.writeFileSync(path.join(distDir, 'README.md'), readme);
console.log('✅ Создан README.md\n');

// Восстановление API папки больше не нужно (сборка происходит в build-without-api.js)

console.log('\n✅ Папка dist создана успешно!');
console.log(`📁 Расположение: ${distDir}`);
console.log('\n📤 Теперь можно загрузить содержимое папки dist на сервер через FileZilla!');
console.log('\n📝 См. README.md в папке dist для инструкций по деплою!');
