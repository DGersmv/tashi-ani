# ✅ Решение: Переписать API на PHP (как в LandscapeHelper_Website)

## 🔍 Проблема

**tashi-ani** использует Next.js API routes (требуют Node.js), а хостинг поддерживает только PHP.

**LandscapeHelper_Website** работает на том же хостинге, потому что использует PHP API!

---

## 💡 Решение

Переписать все API routes из Next.js (TypeScript) на PHP, чтобы они работали на PHP хостинге.

---

## 📋 План действий

### 1. Создать PHP версии всех API routes

**Текущие Next.js API routes:**
- `/api/auth/login` → `api/auth/login.php`
- `/api/auth/send-code` → `api/auth/send-code.php`
- `/api/user/objects` → `api/user/objects.php`
- `/api/user/profile` → `api/user/profile.php`
- `/api/messages` → `api/messages.php`
- И ещё ~47 других...

### 2. Изменить сборку проекта

- Отключить Next.js API routes
- Собирать только статические файлы (фронтенд)
- Копировать PHP файлы в `dist/api/`

### 3. Настроить Prisma для работы с PHP

- Использовать Prisma Client через REST API
- Или переписать все запросы на чистый SQL (PDO)

---

## 🎯 Преимущества

- ✅ Работает на PHP хостинге (как LandscapeHelper_Website)
- ✅ Можно использовать PostgreSQL от reg.ru
- ✅ Или MySQL на хостинге
- ✅ Не нужен Node.js

---

## ⚠️ Сложность

- Нужно переписать ~53 API routes
- Это большой объем работы
- Но возможно!

---

## 🚀 Альтернатива

**Быстрое решение:**
1. Оставить Next.js как есть
2. Найти VPS или хостинг с Node.js
3. Использовать PostgreSQL от reg.ru

**Или:**
1. Переписать API на PHP (как LandscapeHelper_Website)
2. Работает на PHP хостинге
3. Можно использовать MySQL на хостинге или PostgreSQL от reg.ru

---

**Хотите переписать API на PHP или найти хостинг с Node.js?**
