# Tashi Ani - Система управления проектами

Полнофункциональная система управления проектами для архитекторов и дизайнеров с поддержкой 3D моделей, панорам, документации и коммуникации с клиентами.

## ✨ Основные возможности

- 🏗️ **Управление объектами и проектами** - организация и отслеживание архитектурных проектов
- 📸 **Фотогалереи** - загрузка и организация фотографий с комментариями
- 🌐 **360° Панорамы** - просмотр и комментирование панорамных изображений
- 🏛️ **3D/BIM модели** - поддержка IFC, glTF и других форматов 3D моделей
- 📄 **Управление документами** - хранение и управление проектной документацией
- 💬 **Система сообщений** - встроенная коммуникация между архитекторами и клиентами
- 🔐 **Ролевая система** - разграничение доступа для администраторов и клиентов
- 🔔 **Уведомления** - система уведомлений о новых комментариях и обновлениях

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установите зависимости
npm install

# Создайте файл .env.local из примера
cp .env.local.example .env.local

# Отредактируйте .env.local и установите:
# DATABASE_URL="file:./prisma/dev.db"
# JWT_SECRET="your-secret-key-min-32-chars"  # openssl rand -base64 32
# MASTER_ADMIN_EMAIL="admin@example.com"
# MASTER_ADMIN_PASSWORD="your-password"

# Создайте базу данных
npx prisma generate
npx prisma migrate dev

# Создайте админа
node create-admin-user.js

# Запустите dev сервер
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### Деплой на сервер

См. инструкцию: [MINIMAL_SERVER_SETUP.md](./MINIMAL_SERVER_SETUP.md)

## 📁 Структура проекта

```
tashi-ani/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API endpoints (75+ routes)
│   │   ├── dashboard/    # Панель управления
│   │   └── portfolio/    # Публичное портфолио
│   ├── components/       # React компоненты
│   │   ├── BimModelViewer.tsx    # 3D модели viewer
│   │   ├── PanoramaViewer.tsx    # 360° панорамы
│   │   └── ...
│   ├── lib/             # Утилиты и библиотеки
│   │   ├── prisma.ts    # Prisma client
│   │   ├── security.ts  # Security utilities
│   │   └── userManagement.ts  # Auth и управление пользователями
│   └── types/           # TypeScript типы
├── prisma/
│   ├── schema.prisma    # База данных схема
│   └── migrations/      # Миграции БД
├── public/
│   ├── uploads/         # Загруженные файлы
│   └── ...
└── ...
```

## 🛠️ Технологический стек

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (легко мигрировать на PostgreSQL)
- **3D/BIM**: Three.js, @thatopen/components, web-ifc
- **Authentication**: JWT, bcryptjs
- **Panoramas**: Photo Sphere Viewer
- **Deployment**: PM2, Nginx

## 📜 Скрипты

```bash
# Development
npm run dev              # Запуск dev сервера

# Production
npm run build           # Сборка для production
npm run start           # Запуск production сервера

# Database
npm run db:migrate      # Применить миграции БД
npm run db:studio       # Открыть Prisma Studio

# PM2 (Production)
npm run pm2:start       # Запустить через PM2
npm run pm2:restart     # Перезапустить
npm run pm2:logs        # Просмотр логов
npm run pm2:stop        # Остановить

# Deploy
npm run deploy          # Полный деплой (install + build + restart)
```

## 🔒 Безопасность

Проект включает несколько уровней безопасности:
- ✅ Защита от path traversal атак
- ✅ Валидация и санитизация пользовательского ввода
- ✅ JWT-based аутентификация
- ✅ Bcrypt для хеширования паролей
- ✅ Ролевое управление доступом
- ✅ Логирование подозрительной активности

**Важно:** Всегда устанавливайте сильный `JWT_SECRET` в production!

См. [SECURITY_FIX.md](./SECURITY_FIX.md) для деталей и [RECOMMENDATIONS.md](./RECOMMENDATIONS.md) для рекомендаций по улучшению безопасности.

## 📚 Документация

- [RECOMMENDATIONS.md](./RECOMMENDATIONS.md) - Рекомендации по улучшению проекта
- [MINIMAL_SERVER_SETUP.md](./MINIMAL_SERVER_SETUP.md) - Минимальная настройка сервера
- [DEPLOY_REG_RU.md](./DEPLOY_REG_RU.md) - Деплой на Reg.ru
- [SECURITY_FIX.md](./SECURITY_FIX.md) - Исправления безопасности
- [BUILD_AND_DEPLOY.md](./BUILD_AND_DEPLOY.md) - Сборка и деплой
- [SERVER_COMMANDS.md](./SERVER_COMMANDS.md) - Полезные команды для сервера

## 🤝 Contributing

При внесении изменений:
1. Следуйте существующему code style
2. Используйте TypeScript strict mode
3. Добавляйте комментарии к сложной логике
4. Тестируйте изменения локально перед commit

## 📝 Лицензия

Проект для внутреннего использования.

## 👥 Авторы

Разработано для архитектурного бюро.

## 📞 Поддержка

При обнаружении проблем или вопросов обращайтесь к команде разработки.
