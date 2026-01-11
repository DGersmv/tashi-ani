# 🚀 Настройка сервера VK Cloud с нуля

## 📋 Информация о сервере

- **IP:** 87.239.108.115
- **Пользователь:** ubuntu (не root!)
- **ОС:** Ubuntu
- **Конфигурация:** STD2-1-2 (2 CPU, 2GB RAM, 20GB диск)

## 🔑 Шаг 1: Создание SSH ключа для VK Cloud

### На Windows:

```powershell
# Создайте новый ключ специально для VK Cloud
ssh-keygen -t ed25519 -C "vk-cloud-server" -f C:\Users\DGer\.ssh\vk_cloud_ed25519

# Когда спросит пароль - можете оставить пустым (Enter) или задать пароль
```

### Скопируйте публичный ключ:

```powershell
# Покажите публичный ключ
Get-Content C:\Users\DGer\.ssh\vk_cloud_ed25519.pub
```

**Скопируйте весь вывод** (начинается с `ssh-ed25519` и заканчивается `vk-cloud-server`)

## 🔐 Шаг 2: Добавление ключа в VK Cloud

1. Зайдите в панель VK Cloud
2. Перейдите в раздел **"Ключи"** или **"SSH Keys"**
3. Нажмите **"Добавить ключ"** или **"Создать ключ"**
4. Вставьте ваш публичный ключ (который скопировали выше)
5. Сохраните

## 🔌 Шаг 3: Подключение к серверу

```powershell
# Установите права на ключ
icacls C:\Users\DGer\.ssh\vk_cloud_ed25519 /inheritance:r
icacls C:\Users\DGer\.ssh\vk_cloud_ed25519 /grant:r "%USERNAME%:R"

# Подключитесь к серверу
ssh -i C:\Users\DGer\.ssh\vk_cloud_ed25519 ubuntu@87.239.108.115
```

**Важно:** Пользователь `ubuntu`, не `root`!

## 🛡️ Шаг 4: Настройка безопасности (СРАЗУ после первого входа!)

```bash
# 1. Обновите систему
sudo apt update && sudo apt upgrade -y

# 2. Установите firewall и fail2ban
sudo apt install -y ufw fail2ban

# 3. Настройте firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh      # SSH порт
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
sudo ufw status

# 4. Настройте fail2ban (АГРЕССИВНЫЕ НАСТРОЙКИ!)
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 86400
findtime = 300
maxretry = 3
destemail = root@localhost
sendname = Fail2Ban
action = %(action_)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 86400
findtime = 300
EOF

sudo systemctl restart fail2ban
sudo fail2ban-client status sshd

# 5. Измените порт SSH (рекомендуется)
sudo nano /etc/ssh/sshd_config
# Найдите: #Port 22
# Измените на: Port 23456 (или другой случайный порт)
# Найдите: PasswordAuthentication
# Измените на: PasswordAuthentication no
# Сохраните: Ctrl+O, Enter, Ctrl+X

sudo systemctl restart sshd

# 6. Обновите firewall для нового порта
sudo ufw allow 23456/tcp
sudo ufw delete allow ssh
sudo ufw status

# 7. ОГРАНИЧЬТЕ SSH только с вашего IP (ВАЖНО!)
# Узнайте ваш IP: https://whatismyipaddress.com
# Замените YOUR_IP на ваш IP:
sudo ufw delete allow 23456/tcp
sudo ufw allow from YOUR_IP to any port 23456 proto tcp

# 8. Настройте автоматическую очистку журналов
sudo tee /etc/systemd/journald.conf > /dev/null << 'EOF'
[Journal]
SystemMaxUse=100M
SystemKeepFree=500M
MaxRetentionSec=7day
EOF

sudo systemctl restart systemd-journald

# 9. Проверьте что всё работает
echo "=== Проверка безопасности ==="
sudo ufw status
sudo fail2ban-client status sshd
grep -E "^(Port|PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config
```

## 📦 Шаг 5: Установка Node.js, PM2, Nginx

```bash
# 1. Установите Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверьте версию
node -v  # Должно быть v20.x.x
npm -v

# 2. Установите PM2
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 3. Установите Nginx
sudo apt install -y nginx

# 4. Создайте конфигурацию для сайта
sudo tee /etc/nginx/sites-available/tashi-ani > /dev/null << 'EOF'
server {
    listen 80;
    server_name tashi-ani.ru www.tashi-ani.ru;

    access_log /var/log/nginx/tashi-ani-access.log;
    error_log /var/log/nginx/tashi-ani-error.log;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/tashi-ani /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
sudo nginx -t

# Запустите Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## 📥 Шаг 6: Установка проекта

```bash
# 1. Перейдите в рабочую директорию
cd /var/www

# 2. Клонируйте проект
sudo git clone https://github.com/DGersmv/tashi-ani.git
cd tashi-ani

# 3. Установите права (важно для ubuntu пользователя!)
sudo chown -R ubuntu:ubuntu /var/www/tashi-ani

# 4. Создайте файл переменных окружения
nano .env.local

# Вставьте следующее (ЗАМЕНИТЕ на свои значения):
# PostgreSQL от VK Cloud Managed Database
DATABASE_URL="postgresql://user:password@c-xxxxx.rw.mdb.yandexcloud.net:6432/tashi_ani_prod?sslmode=require"
# Получите строку подключения в панели VK Cloud после создания PostgreSQL инстанса
# См. подробную инструкцию: VK_CLOUD_DATABASE_MIGRATION.md

JWT_SECRET="ЗАМЕНИТЕ_НА_СЛУЧАЙНУЮ_СТРОКУ_МИНИМУМ_32_СИМВОЛА"
MASTER_ADMIN_EMAIL="admin@227.info"
MASTER_ADMIN_PASSWORD="ВАШ_ПАРОЛЬ_АДМИНА"
EMAIL_USER="user@tashi-ani.ru"
EMAIL_PASS="ВАШ_ПАРОЛЬ_EMAIL"
NEXTAUTH_URL="https://tashi-ani.ru"
NODE_ENV="production"

# Сохраните: Ctrl+O, Enter, Ctrl+X

# 5. Установите зависимости
npm install

# 6. Установите PostgreSQL клиент (для подключения к базе)
sudo apt install -y postgresql-client

# 7. Создайте базу данных (примените миграции Prisma)
npx prisma generate
npx prisma migrate deploy

# 8. Создайте админа
node create-admin-user.js

# 9. Соберите проект
NODE_OPTIONS="--max-old-space-size=512" npm run build

# 10. Запустите через PM2
pm2 start ecosystem.config.js
pm2 save

# 11. Проверьте статус
pm2 status
pm2 logs tashi-ani --lines 20
```

## 🔒 Шаг 7: Установка SSL (HTTPS)

```bash
# Установите Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d tashi-ani.ru -d www.tashi-ani.ru

# Следуйте инструкциям:
# - Email: ваш email
# - Согласитесь с условиями (Y)
# - Redirect HTTP to HTTPS: выберите 2 (Redirect)

# Проверьте что сертификат установился
sudo certbot certificates
```

## ✅ Финальная проверка

```bash
# 1. Проверьте статус всех сервисов
sudo systemctl status nginx
pm2 status
sudo fail2ban-client status sshd

# 2. Проверьте firewall
sudo ufw status

# 3. Проверьте память
free -h

# 4. Проверьте использование диска
df -h

# 5. Проверьте сайт в браузере
# https://tashi-ani.ru
```

## 🔄 Обновление SSH подключения после смены порта

После изменения порта SSH на 23456, подключайтесь так:

```powershell
# На Windows:
ssh -i C:\Users\DGer\.ssh\vk_cloud_ed25519 -p 23456 ubuntu@87.239.108.115
```

## 🗄️ База данных: PostgreSQL

**ВАЖНО:** Проект теперь использует PostgreSQL вместо SQLite!

### 💰 Два варианта:

#### ⚠️ Вариант А: Managed PostgreSQL (дорого!)
- **Стоимость:** ~5000₽/месяц даже за минимальную конфигурацию
- См. [VK_CLOUD_DATABASE_MIGRATION.md](./VK_CLOUD_DATABASE_MIGRATION.md)

#### ✅ Вариант Б: PostgreSQL на сервере (рекомендуется!)
- **Стоимость:** 0₽ дополнительно (используете ресурсы сервера)
- **Экономия:** ~5000₽/месяц! 💰
- См. [VK_CLOUD_POSTGRESQL_ALTERNATIVE.md](./VK_CLOUD_POSTGRESQL_ALTERNATIVE.md)

### Быстрая установка на сервер:

```bash
# Установите PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Создайте базу данных и пользователя
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_ПАРОЛЬ';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"

# Обновите .env.local
# DATABASE_URL="postgresql://tashi_ani_user:ПАРОЛЬ@localhost:5432/tashi_ani_prod"
```

**Подробная инструкция:** [VK_CLOUD_POSTGRESQL_ALTERNATIVE.md](./VK_CLOUD_POSTGRESQL_ALTERNATIVE.md)

## 📝 Важные отличия от reg.ru

1. **Пользователь:** `ubuntu` вместо `root`
2. **Права:** Используйте `sudo` для административных команд
3. **PM2:** Запускайте от пользователя `ubuntu`, не root
4. **Права на файлы:** Убедитесь что файлы проекта принадлежат `ubuntu:ubuntu`
5. **База данных:** PostgreSQL от VK Cloud (не SQLite!)

## 🆘 Если что-то не работает

1. **Не могу подключиться:** Проверьте что ключ добавлен в VK Cloud
2. **Permission denied:** Используйте `sudo` или проверьте права на файлы
3. **PM2 не запускается:** Запустите `pm2 startup` от пользователя ubuntu
4. **Сборка падает:** Добавьте swap (см. ниже)

## 💾 Добавление swap (если нужно)

```bash
# Создайте swap 1GB
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Проверьте
free -h
```

