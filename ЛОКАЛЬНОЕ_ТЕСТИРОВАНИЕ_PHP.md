# 🧪 Локальное тестирование PHP API

## 📋 Варианты тестирования

### Вариант 1: Установить PHP локально (рекомендуется)

#### Windows:

1. **Скачать PHP:**
   - Перейти на https://windows.php.net/download/
   - Скачать PHP 8.1+ (Thread Safe, ZIP версия)
   - Распаковать в `C:\php`

2. **Добавить PHP в PATH:**
   - Открыть "Переменные среды" (Environment Variables)
   - Добавить `C:\php` в PATH
   - Или использовать команду PowerShell (от администратора):
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\php", "Machine")
   ```

3. **Проверить установку:**
   ```powershell
   php -v
   ```

4. **Установить расширение PostgreSQL:**
   - Скачать `php_pdo_pgsql.dll` и `php_pgsql.dll` для вашей версии PHP
   - Поместить в папку `C:\php\ext`
   - Раскомментировать в `php.ini`:
     ```ini
     extension=pdo_pgsql
     extension=pgsql
     ```

#### Альтернатива: XAMPP

1. Скачать XAMPP: https://www.apachefriends.org/
2. Установить (включает PHP, Apache, MySQL)
3. PHP будет доступен в `C:\xampp\php`

---

### Вариант 2: Использовать Docker (если установлен)

```bash
docker run -it --rm -v "%cd%":/app -w /app -p 8000:8000 php:8.1-cli php -S localhost:8000 -t .
```

---

## 🚀 Запуск локального PHP сервера

После установки PHP:

### 1. Проверка синтаксиса PHP файлов

```powershell
# Проверить все PHP файлы на синтаксические ошибки
Get-ChildItem -Path api -Recurse -Filter *.php | ForEach-Object {
    Write-Host "Checking $($_.FullName)..."
    php -l $_.FullName
}
```

### 2. Запуск встроенного PHP сервера

```powershell
# Запустить сервер на порту 8000
php -S localhost:8000 -t .
```

Или использовать скрипт из package.json:
```powershell
npm run php:dev
```

### 3. Тестирование API

После запуска сервера, API будет доступно по адресу:
- `http://localhost:8000/api/user/profile.php?email=test@example.com`
- `http://localhost:8000/api/auth/login.php` (POST)

---

## 📝 Добавление скриптов в package.json

Я добавлю скрипты для удобства:

- `npm run php:check` - проверка синтаксиса всех PHP файлов
- `npm run php:dev` - запуск PHP сервера на порту 8000
- `npm run php:test` - запуск тестовых запросов к API

---

## ⚠️ Важные замечания

1. **База данных:** Для полного тестирования нужен доступ к PostgreSQL
   - Можно использовать локальную PostgreSQL
   - Или подключиться к reg.ru кластеру (если доступен с вашего IP)

2. **Конфигурация:** Создайте `config.php` в корне проекта:
   ```php
   <?php
   define('DATABASE_URL', 'postgresql://admin:Gdv2210974!@79.174.89.232:15555/db1?sslmode=require');
   define('JWT_SECRET', 'your-secret-key-min-32-chars');
   // ... другие настройки
   ?>
   ```

3. **CORS:** Встроенный PHP сервер может иметь проблемы с CORS. Для тестирования можно временно отключить проверку CORS в браузере или использовать расширение.

---

## 🧪 Простое тестирование без установки PHP

Если PHP не установлен, можно:

1. **Проверить синтаксис онлайн:**
   - Использовать онлайн PHP linter
   - Или загрузить на хостинг и проверить там

2. **Использовать Docker:**
   ```bash
   docker run -it --rm -v "%cd%":/app -w /app php:8.1-cli php -l api/db.php
   ```

3. **Проверить на хостинге:**
   - Загрузить файлы на хостинг
   - Протестировать там

---

## ✅ Рекомендуемый порядок действий

1. Установить PHP локально (или использовать XAMPP)
2. Проверить синтаксис: `npm run php:check`
3. Создать `config.php` с настройками БД
4. Запустить сервер: `npm run php:dev`
5. Протестировать несколько endpoints в браузере или через Postman
