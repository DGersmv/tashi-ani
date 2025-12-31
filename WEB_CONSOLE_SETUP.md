# 🔧 Настройка доступа через веб-консоль reg.ru

## ✅ Вы уже в веб-консоли - отлично!

Теперь нужно выполнить несколько команд для настройки и проверки.

## Шаг 1: Проверьте текущее состояние сервера

```bash
# Проверьте, что вы в правильной директории
pwd

# Перейдите в директорию проекта
cd /var/www/tashi-ani

# Проверьте статус приложения
pm2 status

# Посмотрите логи
pm2 logs tashi-ani --lines 50
```

## Шаг 2: Создайте или проверьте SSH ключ для доступа с вашего компьютера

### Вариант A: Создать новый SSH ключ на сервере (для добавления на ваш компьютер)

```bash
# Создайте SSH ключ на сервере (если его нет)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/server_key -N ""

# Покажите публичный ключ (скопируйте его)
cat ~/.ssh/server_key.pub
```

**Скопируйте публичный ключ** - он понадобится для добавления на ваш компьютер.

### Вариант B: Добавить ваш публичный ключ на сервер

**На вашем компьютере (PowerShell):**
```powershell
# Создайте SSH ключ если его нет
ssh-keygen -t rsa -b 4096

# Покажите ваш публичный ключ (скопируйте его)
cat "$env:USERPROFILE\.ssh\id_rsa.pub"
```

**В веб-консоли на сервере:**
```bash
# Создайте директорию .ssh если её нет
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Откройте файл authorized_keys
nano ~/.ssh/authorized_keys
```

**Вставьте ваш публичный ключ** в файл, сохраните (Ctrl+X, Y, Enter)

```bash
# Установите правильные права
chmod 600 ~/.ssh/authorized_keys
```

## Шаг 3: Проверьте проблему с "нет сети"

```bash
# Перейдите в директорию проекта
cd /var/www/tashi-ani

# Проверьте статус PM2
pm2 status

# Если приложение не запущено или показывает ошибку
pm2 restart tashi-ani
# или
pm2 start ecosystem.config.js

# Проверьте логи на ошибки
pm2 logs tashi-ani --lines 100

# Проверьте переменные окружения
pm2 env 0 | grep -E "JWT_SECRET|DATABASE_URL|MASTER_ADMIN"
```

## Шаг 4: Проверьте файл .env.local

```bash
# Проверьте наличие файла
ls -la .env.local

# Посмотрите содержимое
cat .env.local

# Если файла нет или в нём не хватает переменных, создайте/отредактируйте
nano .env.local
```

**Убедитесь, что в .env.local есть:**
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-super-secret-jwt-key-here"
MASTER_ADMIN_EMAIL="2277277@bk.ru"
MASTER_ADMIN_PASSWORD="admin123"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"
```

## Шаг 5: Проверьте базу данных

```bash
# Проверьте, существует ли база данных
ls -la prisma/dev.db

# Если базы нет, создайте её
npx prisma migrate deploy
# или
npx prisma db push
```

## Шаг 6: Перезапустите приложение

```bash
# Перезапустите с обновлением переменных окружения
pm2 restart tashi-ani --update-env

# Проверьте логи
pm2 logs tashi-ani --lines 50

# Проверьте статус
pm2 status
```

## Шаг 7: Проверьте, что сервер слушает на порту 3000

```bash
# Проверьте, что порт 3000 слушается
netstat -tulpn | grep 3000
# или
ss -tulpn | grep 3000
```

## 🔍 Диагностика проблемы "нет сети"

Если проблема сохраняется, проверьте:

```bash
# 1. Проверьте логи приложения
pm2 logs tashi-ani --err --lines 100

# 2. Проверьте, что Next.js запущен
ps aux | grep node

# 3. Проверьте доступность API
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# 4. Проверьте переменные окружения в процессе
pm2 env 0
```

## 📝 Быстрые команды для копирования

Скопируйте и выполните эти команды по очереди в веб-консоли:

```bash
cd /var/www/tashi-ani && pm2 status
```

```bash
pm2 logs tashi-ani --lines 50
```

```bash
cat .env.local
```

```bash
pm2 restart tashi-ani --update-env
```

## ✅ После исправления

1. Перезапустите приложение: `pm2 restart tashi-ani`
2. Проверьте логи: `pm2 logs tashi-ani`
3. Попробуйте войти в кабинет на сайте
4. Если проблема сохраняется, пришлите вывод логов

