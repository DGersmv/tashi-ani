# 📊 Статус миграции API на PHP

## ✅ Выполнено

### Базовая инфраструктура
- ✅ `api/db.php` - подключение к PostgreSQL
- ✅ `api/lib/userManagement.php` - функции для работы с пользователями
- ✅ `api/lib/email.php` - отправка email через SMTP
- ✅ `config.example.php` - шаблон конфигурации

### Auth API (аутентификация)
- ✅ `api/auth/login.php` - вход пользователя
- ✅ `api/auth/send-code.php` - отправка кода верификации
- ✅ `api/auth/verify-code.php` - проверка кода верификации

### User API (пользователь)
- ✅ `api/user/profile.php` - профиль пользователя
- ✅ `api/user/objects.php` - список объектов пользователя
- ✅ `api/user/object-details.php` - детали объекта

### Messages API (сообщения)
- ✅ `api/messages.php` - отправка/получение/удаление сообщений

### Uploads API (загрузка файлов)
- ✅ `api/uploads/get-file.php` - получение файлов (photo, panorama, document, project)

---

## 📋 В процессе

### User API (пользователь)
- [ ] `api/user/stats.php` - статистика пользователя

---

## ⏳ Осталось сделать

### Messages API (сообщения)
- ✅ `api/messages.php` - отправка/получение/удаление сообщений
- ✅ `api/messages/mark-read.php` - пометить как прочитанное
- [ ] `api/messages/unread-count.php` - количество непрочитанных

### Comments API (комментарии)
- ✅ `api/photo-comments.php` - комментарии к фото (GET, POST)
- ✅ `api/photo-comments/mark-read.php` - пометить как прочитанное
- ✅ `api/panorama-comments.php` - комментарии к панорамам (GET, POST, DELETE)
- ✅ `api/panorama-comments/mark-read.php` - пометить как прочитанное

### Admin API (админка)
- ✅ `api/admin/users.php` - список пользователей, создание, удаление (GET, POST, DELETE)
- ✅ `api/admin/user-details.php` - детали и редактирование пользователя (GET, PUT)
- ✅ `api/admin/objects.php` - список объектов, создание, удаление (GET, POST, DELETE)
- ✅ `api/admin/object-details.php` - детали объекта для админа (GET)
- ✅ `api/admin/object-photos.php` - управление фото (PUT, DELETE)
- ✅ `api/admin/object-panoramas.php` - управление панорамами (PUT, DELETE)
- [ ] Другие admin routes (folders, documents, projects, etc.)

### Notifications API
- ✅ `api/notifications/unread.php` - непрочитанные уведомления (GET)

### Portfolio API
- ✅ `api/portfolio.php` - портфолио (GET)
- [ ] `api/portfolio/projects.php` - проекты портфолио

### Background API
- [ ] `api/bg/route.php` - фоновые изображения

### Projects API
- [ ] `api/projects/[id]/documents.php` - документы проекта

### Documents API
- ✅ `api/documents/view.php` - просмотр документа (GET)
- ✅ `api/projects/documents.php` - документы проекта (GET)

### Bim Models API
- ✅ `api/user/object-models.php` - список моделей объекта (GET)
- ✅ `api/user/model-view.php` - просмотр модели (GET)
- ✅ `api/user/model-download.php` - скачивание модели (GET)
- [ ] `api/user/model-comments.php` - комментарии модели

---

## 📊 Прогресс

**Готово:** ~30 из ~53 endpoints (~57%)

**Критичные для базовой работы:**
- ✅ Auth (login, send-code, verify-code)
- ✅ User profile
- ✅ User objects list
- [ ] User object detail (в процессе)
- [ ] Messages
- [ ] Uploads (файлы)

---

## 🎯 Следующие шаги

1. ✅ Все критические endpoints созданы!
2. Обновить frontend для вызова PHP API вместо Next.js routes
3. Протестировать на PHP хостинге
4. При необходимости создать оставшиеся опциональные endpoints

---

**Продолжаем создавать остальные endpoints!**
