# 🚀 План миграции API на PHP

## ✅ Выполнено

1. ✅ Создана базовая структура PHP API
   - `api/db.php` - подключение к PostgreSQL
   - `api/lib/userManagement.php` - функции для работы с пользователями
   - `config.example.php` - шаблон конфигурации

2. ✅ Созданы первые PHP API endpoints:
   - `api/auth/login.php` - вход пользователя
   - `api/user/profile.php` - профиль пользователя

3. ✅ Обновлен скрипт сборки `scripts/create-dist.js`
   - Копирует PHP файлы в dist
   - Создает .htaccess для перенаправления
   - Создает README для PHP хостинга

---

## 📋 Что нужно сделать дальше

### 1. Переписать все остальные API routes на PHP

**Приоритет 1 (критично):**
- [ ] `api/auth/send-code.php` - отправка кода верификации
- [ ] `api/auth/verify-code.php` - проверка кода верификации
- [ ] `api/user/objects.php` - список объектов пользователя
- [ ] `api/user/objects/[id].php` - детали объекта
- [ ] `api/user/stats.php` - статистика пользователя

**Приоритет 2 (важно):**
- [ ] `api/messages.php` - сообщения
- [ ] `api/messages/unread-count.php` - непрочитанные сообщения
- [ ] `api/uploads/objects/[id]/[filename].php` - загрузка файлов
- [ ] `api/photo-comments/route.php` - комментарии к фото
- [ ] `api/panorama-comments/route.php` - комментарии к панорамам

**Приоритет 3 (админка):**
- [ ] `api/admin/users.php` - список пользователей
- [ ] `api/admin/objects.php` - список объектов
- [ ] `api/admin/users/create.php` - создание пользователя
- [ ] И другие admin routes...

### 2. Обновить frontend для вызова PHP API

Нужно изменить все вызовы API с:
- `/api/auth/login` → `/api/auth/login.php`
- `/api/user/profile` → `/api/user/profile.php`
- И т.д.

Или настроить .htaccess чтобы работало и без .php расширения.

### 3. Настроить отправку email (для кодов верификации)

Нужно создать `api/lib/email.php` аналогично `E:\LandscapeHelper_Website\api\get-license-key.php`.

### 4. Тестирование

- Протестировать все API endpoints
- Проверить работу на PHP хостинге
- Убедиться что все функции работают

---

## 🔄 Следующие шаги

1. Продолжить переписывание API routes на PHP
2. Обновить frontend для работы с PHP API
3. Протестировать на локальном PHP сервере
4. Загрузить на хостинг и протестировать там

---

## 💡 Важные замечания

- Все API routes теперь работают через PHP (без Node.js)
- База данных PostgreSQL (reg.ru кластер)
- Все файлы загружаются через FileZilla (как LandscapeHelper_Website)
- Нет вирусов и майнеров на PHP хостинге ✅
