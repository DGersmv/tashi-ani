# 🆕 ПОЛНАЯ ПЕРЕУСТАНОВКА UBUNTU И НАСТРОЙКА ЧИСТОГО СЕРВЕРА

## ⚠️ ВАЖНО: Это полностью сотрет все данные на сервере!

---

## 📋 ЭТАП 1: ПЕРЕУСТАНОВКА UBUNTU НА REG.RU

### 1.1 Переустановка через панель управления reg.ru

1. **Зайдите в панель управления reg.ru:**
   - Откройте https://www.reg.ru/
   - Войдите в личный кабинет
   - Перейдите в раздел "VPS" или "Серверы"

2. **Найдите ваш VPS сервер:**
   - IP: `89.104.67.209` (или ваш текущий IP)
   - Найдите кнопку "Переустановка ОС" или "Reinstall OS"

3. **Выберите Ubuntu:**
   - Выберите **Ubuntu 22.04 LTS** (или последнюю стабильную версию)
   - Выберите вариант "Минимальная установка" (без дополнительного ПО)
   - **ВНИМАНИЕ:** Это удалит ВСЕ данные на сервере!

4. **Настройте пароль root:**
   - Установите **сложный пароль** для root пользователя
   - Сохраните пароль в безопасном месте
   - Или настройте SSH ключ (рекомендуется)

5. **Запустите переустановку:**
   - Нажмите "Подтвердить" или "Переустановить"
   - Дождитесь завершения (обычно 5-10 минут)

6. **Проверьте статус:**
   - Дождитесь уведомления об успешной переустановке
   - Сервер автоматически перезагрузится

---

## 📋 ЭТАП 2: ПЕРВОНАЧАЛЬНАЯ НАСТРОЙКА UBUNTU

### 2.1 Подключение к серверу

**Через веб-консоль reg.ru:**
1. В панели управления найдите "Веб-консоль" или "VNC"
2. Откройте консоль и войдите как `root` с новым паролем

**Или через SSH (если настроен):**
```bash
ssh root@89.104.67.209
```

### 2.2 Обновление системы

```bash
# Обновите список пакетов
apt update

# Обновите все пакеты до последних версий
apt upgrade -y

# Перезагрузите сервер (если требуется)
reboot
```

### 2.3 Настройка базовой безопасности

```bash
# Установите базовые утилиты
apt install -y curl wget git nano ufw fail2ban htop

# Настройте firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Проверьте статус firewall
ufw status
```

### 2.4 Настройка fail2ban (защита от брутфорса)

```bash
# fail2ban уже установлен, настроим его
systemctl enable fail2ban
systemctl start fail2ban

# Проверьте статус
systemctl status fail2ban
```

### 2.5 Создание пользователя для приложения (опционально)

```bash
# Создайте пользователя (если не хотите использовать root)
adduser tashi
usermod -aG sudo tashi

# Переключитесь на нового пользователя
su - tashi
```

---

## 📋 ЭТАП 3: УСТАНОВКА NODE.JS И NPM

### 3.1 Установка Node.js через NodeSource

```bash
# Установите Node.js 20.x LTS (рекомендуется)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Установите Node.js
apt install -y nodejs

# Проверьте версии
node --version
npm --version

# Должно быть примерно:
# node: v20.x.x
# npm: 10.x.x
```

### 3.2 Установка PM2 глобально

```bash
# Установите PM2
npm install -g pm2

# Проверьте установку
pm2 --version

# Настройте автозапуск PM2
pm2 startup
# Выполните команду, которую выведет pm2 startup
```

---

## 📋 ЭТАП 4: УСТАНОВКА NGINX

### 4.1 Установка Nginx

```bash
# Установите Nginx
apt install -y nginx

# Запустите и включите автозапуск
systemctl start nginx
systemctl enable nginx

# Проверьте статус
systemctl status nginx
```

### 4.2 Настройка Nginx (базовая)

```bash
# Удалите дефолтную конфигурацию
rm /etc/nginx/sites-enabled/default

# Создайте конфигурацию для вашего сайта
nano /etc/nginx/sites-available/tashi-ani
```

**Вставьте следующую конфигурацию:**

```nginx
server {
    listen 80;
    server_name tashi-ani.ru www.tashi-ani.ru;

    # Логи
    access_log /var/log/nginx/tashi-ani-access.log;
    error_log /var/log/nginx/tashi-ani-error.log;

    # Проксирование на Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты для больших файлов
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы (если нужно)
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Сохраните:** `Ctrl+X`, затем `Y`, затем `Enter`

**Активируйте конфигурацию:**

```bash
# Создайте симлинк
ln -s /etc/nginx/sites-available/tashi-ani /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезапустите Nginx
systemctl restart nginx
```

---

## 📋 ЭТАП 5: УСТАНОВКА ПРОЕКТА ИЗ GITHUB

### 5.1 Создание директории проекта

```bash
# Создайте директорию для проекта
mkdir -p /var/www/tashi-ani
cd /var/www/tashi-ani

# Установите права (если используете отдельного пользователя)
# chown -R tashi:tashi /var/www/tashi-ani
```

### 5.2 Клонирование репозитория GitHub

```bash
# Если репозиторий публичный
git clone https://github.com/your-username/tashi-ani.git .

# Если репозиторий приватный, используйте SSH ключ:
# 1. Создайте SSH ключ на сервере
ssh-keygen -t ed25519 -C "server@tashi-ani.ru"
# 2. Скопируйте публичный ключ
cat ~/.ssh/id_ed25519.pub
# 3. Добавьте ключ в GitHub (Settings -> SSH and GPG keys)
# 4. Клонируйте репозиторий
# git clone git@github.com:your-username/tashi-ani.git .
```

### 5.3 Установка зависимостей

```bash
cd /var/www/tashi-ani

# Установите зависимости
npm install

# Сгенерируйте Prisma клиент
npx prisma generate
```

### 5.4 Настройка переменных окружения

```bash
cd /var/www/tashi-ani

# Создайте файл .env.local
nano .env.local
```

**Вставьте следующее содержимое (замените на свои данные):**

```env
# База данных (SQLite для начала)
DATABASE_URL="file:./prisma/prod.db"

# JWT секрет (ОБЯЗАТЕЛЬНО измените на случайную строку!)
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string-min-32-chars"

# Мастер-админ
MASTER_ADMIN_EMAIL="2277277@bk.ru"
MASTER_ADMIN_PASSWORD="admin123"

# Email настройки
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"

# URL сайта
NEXTAUTH_URL="https://tashi-ani.ru"
NODE_ENV="production"
```

**Сохраните:** `Ctrl+X`, затем `Y`, затем `Enter`

### 5.5 Настройка базы данных

```bash
cd /var/www/tashi-ani

# Примените миграции Prisma
npx prisma migrate deploy

# ИЛИ если базы еще нет, создайте её
npx prisma db push
```

### 5.6 Создание директорий для загрузок

```bash
cd /var/www/tashi-ani

# Создайте директории
mkdir -p public/uploads/objects
mkdir -p public/uploads/projects
mkdir -p logs

# Установите права
chmod 755 public/uploads
chmod 755 public/uploads/objects
chmod 755 public/uploads/projects
chmod 755 logs
```

### 5.7 Сборка проекта

```bash
cd /var/www/tashi-ani

# Соберите проект
npm run build

# Проверьте, что сборка прошла успешно
ls -la .next
```

---

## 📋 ЭТАП 6: ЗАПУСК ПРИЛОЖЕНИЯ

### 6.1 Настройка PM2

```bash
cd /var/www/tashi-ani

# Проверьте, что ecosystem.config.js существует
cat ecosystem.config.js
```

### 6.2 Запуск через PM2

```bash
cd /var/www/tashi-ani

# Запустите приложение
pm2 start ecosystem.config.js

# Сохраните конфигурацию PM2
pm2 save

# Проверьте статус
pm2 status
pm2 logs tashi-ani --lines 50
```

### 6.3 Настройка автозапуска PM2

```bash
# Настройте автозапуск при перезагрузке сервера
pm2 startup

# Выполните команду, которую выведет pm2 startup
# Обычно это что-то вроде:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

## 📋 ЭТАП 7: НАСТРОЙКА SSL (HTTPS)

### 7.1 Установка Certbot

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Проверьте установку
certbot --version
```

### 7.2 Получение SSL сертификата

```bash
# Получите SSL сертификат (замените домены на свои)
certbot --nginx -d tashi-ani.ru -d www.tashi-ani.ru

# Certbot автоматически:
# - Получит сертификат
# - Обновит конфигурацию Nginx
# - Настроит автоматическое обновление
```

### 7.3 Проверка автоматического обновления

```bash
# Проверьте, что автоматическое обновление настроено
certbot renew --dry-run
```

---

## 📋 ЭТАП 8: НАСТРОЙКА АВТОМАТИЧЕСКОГО ДЕПЛОЯ ИЗ GITHUB

### 8.1 Создание скрипта для обновления

```bash
cd /var/www/tashi-ani

# Создайте скрипт для обновления
nano update-from-github.sh
```

**Вставьте следующее содержимое:**

```bash
#!/bin/bash

# Скрипт для обновления проекта из GitHub

set -e  # Остановить при ошибке

echo "🔄 Начинаем обновление из GitHub..."

# Переходим в директорию проекта
cd /var/www/tashi-ani

# Сохраняем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Текущая ветка: $CURRENT_BRANCH"

# Получаем последние изменения
echo "⬇️  Получаем изменения из GitHub..."
git fetch origin

# Переключаемся на нужную ветку (обычно master или main)
git checkout master  # или main, в зависимости от вашего репозитория

# Обновляем код
echo "🔄 Обновляем код..."
git pull origin master

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Генерируем Prisma клиент
echo "🗄️  Генерируем Prisma клиент..."
npx prisma generate

# Применяем миграции базы данных
echo "🗄️  Применяем миграции..."
npx prisma migrate deploy || npx prisma db push

# Собираем проект
echo "🔨 Собираем проект..."
npm run build

# Перезапускаем приложение через PM2
echo "🔄 Перезапускаем приложение..."
pm2 restart tashi-ani

echo "✅ Обновление завершено успешно!"
echo "📊 Статус приложения:"
pm2 status
```

**Сохраните и сделайте исполняемым:**

```bash
chmod +x update-from-github.sh
```

### 8.2 Настройка автоматического обновления через cron (опционально)

```bash
# Откройте crontab
crontab -e

# Добавьте строку для ежедневного обновления в 3:00 ночи
# 0 3 * * * cd /var/www/tashi-ani && ./update-from-github.sh >> /var/log/tashi-ani-update.log 2>&1
```

### 8.3 Ручное обновление

```bash
# Для ручного обновления просто выполните:
cd /var/www/tashi-ani
./update-from-github.sh
```

---

## 📋 ЭТАП 9: НАСТРОЙКА БЭКАПОВ

### 9.1 Создание скрипта бэкапа

```bash
cd /var/www/tashi-ani

# Создайте скрипт бэкапа
nano backup.sh
```

**Вставьте следующее содержимое:**

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/tashi-ani"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/tashi-ani"

# Создаем директорию для бэкапов
mkdir -p $BACKUP_DIR

echo "📦 Создание бэкапа: $DATE"

# Бэкап базы данных
if [ -f "$PROJECT_DIR/prisma/prod.db" ]; then
    echo "🗄️  Бэкап базы данных..."
    cp "$PROJECT_DIR/prisma/prod.db" "$BACKUP_DIR/db_$DATE.db"
fi

# Бэкап загруженных файлов
if [ -d "$PROJECT_DIR/public/uploads" ]; then
    echo "📁 Бэкап загруженных файлов..."
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR" public/uploads
fi

# Бэкап .env.local (важно!)
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo "⚙️  Бэкап конфигурации..."
    cp "$PROJECT_DIR/.env.local" "$BACKUP_DIR/env_$DATE.local"
fi

# Удаляем старые бэкапы (старше 30 дней)
echo "🧹 Удаление старых бэкапов..."
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✅ Бэкап завершен: $DATE"
echo "📊 Размер бэкапов:"
du -sh $BACKUP_DIR
```

**Сохраните и сделайте исполняемым:**

```bash
chmod +x backup.sh
```

### 9.2 Настройка автоматического бэкапа

```bash
# Откройте crontab
crontab -e

# Добавьте строку для ежедневного бэкапа в 2:00 ночи
# 0 2 * * * /var/www/tashi-ani/backup.sh >> /var/log/tashi-ani-backup.log 2>&1
```

---

## 📋 ЭТАП 10: ФИНАЛЬНАЯ ПРОВЕРКА

### 10.1 Проверка работы сайта

```bash
# Проверьте статус PM2
pm2 status

# Проверьте логи
pm2 logs tashi-ani --lines 50

# Проверьте Nginx
systemctl status nginx

# Проверьте доступность сайта
curl http://localhost:3000
```

### 10.2 Проверка безопасности

```bash
# Проверьте firewall
ufw status

# Проверьте fail2ban
systemctl status fail2ban

# Проверьте процессы
ps aux | head -20
```

### 10.3 Тестирование обновления из GitHub

```bash
# Протестируйте обновление
cd /var/www/tashi-ani
./update-from-github.sh
```

---

## ✅ ЧЕКЛИСТ ПОСЛЕ УСТАНОВКИ

- [ ] Ubuntu переустановлен и обновлен
- [ ] Firewall (ufw) настроен и включен
- [ ] fail2ban установлен и работает
- [ ] Node.js установлен (версия 20.x)
- [ ] PM2 установлен и настроен автозапуск
- [ ] Nginx установлен и настроен
- [ ] Проект клонирован из GitHub
- [ ] Зависимости установлены
- [ ] .env.local создан с правильными данными
- [ ] База данных настроена и миграции применены
- [ ] Проект собран успешно
- [ ] Приложение запущено через PM2
- [ ] SSL сертификат установлен
- [ ] Сайт открывается по HTTPS
- [ ] Скрипт обновления из GitHub создан и протестирован
- [ ] Скрипт бэкапа создан и настроен
- [ ] Автоматические бэкапы настроены

---

## 🚀 КОМАНДЫ ДЛЯ ЕЖЕДНЕВНОГО ИСПОЛЬЗОВАНИЯ

### Обновление проекта из GitHub:
```bash
cd /var/www/tashi-ani
./update-from-github.sh
```

### Просмотр логов:
```bash
pm2 logs tashi-ani
pm2 logs tashi-ani --lines 100
```

### Перезапуск приложения:
```bash
pm2 restart tashi-ani
```

### Статус приложения:
```bash
pm2 status
```

### Создание бэкапа вручную:
```bash
cd /var/www/tashi-ani
./backup.sh
```

---

## 🔒 РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ

1. **Регулярно обновляйте систему:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Используйте сложные пароли** для всех сервисов

3. **Настройте SSH ключи** вместо паролей:
   ```bash
   # На вашем компьютере
   ssh-keygen -t ed25519
   ssh-copy-id root@89.104.67.209
   ```

4. **Регулярно проверяйте логи:**
   ```bash
   pm2 logs tashi-ani
   tail -f /var/log/nginx/error.log
   journalctl -u fail2ban
   ```

5. **Мониторьте использование ресурсов:**
   ```bash
   htop
   df -h
   free -h
   ```

6. **Регулярно проверяйте обновления зависимостей:**
   ```bash
   cd /var/www/tashi-ani
   npm audit
   npm audit fix
   ```

---

## 🆘 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Сайт не открывается:
```bash
pm2 status
pm2 logs tashi-ani
systemctl status nginx
nginx -t
```

### Ошибки при обновлении из GitHub:
```bash
cd /var/www/tashi-ani
git status
git pull origin master
npm install
npm run build
pm2 restart tashi-ani
```

### Проблемы с базой данных:
```bash
cd /var/www/tashi-ani
npx prisma migrate status
npx prisma migrate deploy
```

---

## 📞 ПОДДЕРЖКА

При возникновении проблем:
1. Проверьте логи: `pm2 logs tashi-ani`
2. Проверьте статус: `pm2 status`
3. Проверьте Nginx: `systemctl status nginx`
4. Обратитесь в поддержку reg.ru при необходимости





