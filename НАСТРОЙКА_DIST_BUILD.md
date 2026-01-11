# 📦 Настройка сборки в папку dist для FileZilla

## 🎯 Цель

Настроить проект так, чтобы после сборки появлялась папка `dist` с файлами, которые можно загрузить на сервер через FileZilla.

---

## ⚠️ ВАЖНО: Next.js требует Node.js на сервере!

**Next.js с API routes НЕ может работать как статические файлы!**

**Для работы нужен:**
- ✅ Node.js хостинг (хостинг с поддержкой Node.js)
- ❌ Обычный PHP-хостинг НЕ подойдет

**Но:** Мы можем подготовить файлы для загрузки через FileZilla!

---

## 🔧 Решение: Standalone сборка Next.js

Настроим Next.js для создания standalone сборки, которую можно загрузить на Node.js хостинг через FileZilla.

### Шаг 1: Обновить next.config.js

Добавить настройку `output: 'standalone'`:

```javascript
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Добавить эту строку!
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    domains: ['tile.openstreetmap.org'],
  },

  // ... остальной код
};

module.exports = nextConfig;
```

### Шаг 2: Добавить скрипт для создания dist

Добавить скрипт в `package.json`:

```json
{
  "scripts": {
    "build:dist": "npm run build && node scripts/create-dist.js"
  }
}
```

### Шаг 3: Создать скрипт для сборки dist

Создать файл `scripts/create-dist.js` для копирования необходимых файлов.

---

## 📝 Альтернативный вариант: Простая сборка

Просто скопировать необходимые файлы в папку `dist` после `npm run build`:
- `.next/` (собранное приложение)
- `public/` (статические файлы)
- `node_modules/` (зависимости, или установить на сервере)
- `package.json`, `package-lock.json`
- `.env` (или настроить на сервере)
- Другие необходимые файлы

---

**Какой вариант выбрать?**

1. **Standalone build** (рекомендуется) - оптимизированная сборка
2. **Простая сборка** - скопировать все необходимые файлы
