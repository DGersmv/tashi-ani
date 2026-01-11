# 🔧 Настройка API и маршрутизации

## 📋 Что нужно настроить

### 1. ✅ API endpoints уже настроены

Frontend вызывает API через относительные пути:
- `/api/auth/login` → `api/auth/login.php`
- `/api/user/profile` → `api/user/profile.php`
- И т.д.

`.htaccess` автоматически перенаправляет запросы на PHP файлы.

### 2. 🔧 Если нужно изменить базовый URL API

Если ваш сайт находится не в корне домена (например, в подпапке), нужно настроить базовый URL.

**Создайте файл `src/lib/api-config.ts`:**

```typescript
// Базовый URL для API (пусто = текущий домен)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Функция для создания полного URL API
export function getApiUrl(endpoint: string): string {
  const base = API_BASE_URL || '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}
```

**Использование в компонентах:**

```typescript
import { getApiUrl } from '@/lib/api-config';

// Вместо:
fetch('/api/auth/login', ...)

// Используйте:
fetch(getApiUrl('/api/auth/login'), ...)
```

### 3. 🌐 Настройка домена на reg.ru

1. Войдите в панель управления reg.ru
2. Перейдите в "Мои домены"
3. Настройте DNS записи:
   - A запись: указывает на IP хостинга
   - CNAME: для поддоменов (если нужны)

### 4. 📁 Настройка .htaccess

Файл `.htaccess` уже создан в папке `dist`. Он:
- Перенаправляет `/api/*` на `api/*.php`
- Направляет все остальные запросы на `index.html` (для SPA)

**Если нужно изменить:**

Откройте `dist/.htaccess` и настройте под вашу структуру.

### 5. 🔐 Настройка CORS (если frontend и API на разных доменах)

Если frontend и API на разных доменах, нужно настроить CORS в PHP.

**В `api/db.php` уже есть:**

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

**Если нужно ограничить домены:**

```php
$allowedOrigins = ['https://yourdomain.com', 'https://www.yourdomain.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

## ✅ Проверка работы

1. **Проверьте API:**
   ```
   https://ваш-домен.ru/api/portfolio.php
   ```
   Должен вернуть JSON.

2. **Проверьте frontend:**
   ```
   https://ваш-домен.ru/
   ```
   Должен открыться сайт.

3. **Проверьте авторизацию:**
   Попробуйте войти через форму входа.

## ❓ Что именно нужно настроить?

Уточните, что именно:
- **API URL** - если сайт в подпапке?
- **Домен** - настройка DNS?
- **Маршрутизация** - настройка .htaccess?
- **CORS** - если frontend и API на разных доменах?
- **Что-то другое?**
