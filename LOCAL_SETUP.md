# 🚀 Локальная настройка (SQLite)

## 1. Создайте файл `.env` в корне проекта:

```env
# База данных SQLite (для локальной разработки)
DATABASE_URL="file:./dev.db"

# Мастер-админ
MASTER_ADMIN_EMAIL=2277277@bk.ru
MASTER_ADMIN_PASSWORD=admin123

# JWT секрет
JWT_SECRET=your-super-secret-jwt-key-here

# Email настройки (опционально)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 2. Запустите команды для создания базы данных:

```bash
# Сгенерируйте Prisma Client
npx prisma generate

# Создайте базу данных и примените миграции
npx prisma migrate dev --name init

# Откройте Prisma Studio для просмотра данных
npx prisma studio
```

## 3. Создайте тестового пользователя:

```bash
# Запустите Node.js скрипт для создания пользователя
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  // Создаем тестового пользователя
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      status: 'ACTIVE'
    }
  });
  
  console.log('✅ Тестовый пользователь создан: test@example.com');
  await prisma.\$disconnect();
}

createTestData().catch(console.error);
"
```

## 4. Протестируйте API:

### Отправка кода:
```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Проверка кода:
```bash
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'
```

### Вход мастер-админа:
```bash
curl -X POST http://localhost:3000/api/auth/master-login \
  -H "Content-Type: application/json" \
  -d '{"email": "2277277@bk.ru", "password": "admin123"}'
```

## 🎯 Что происходит:

1. **SQLite база** создается в файле `dev.db`
2. **Тестовый пользователь** `test@example.com` может входить по коду
3. **Мастер-админ** `2277277@bk.ru` входит по паролю
4. **Все данные** сохраняются локально

## 🚀 Для продакшена на reg.ru:

Позже мы настроим PostgreSQL на хостинге, но пока SQLite отлично подходит для разработки!

Готовы запустить? 🎉
















