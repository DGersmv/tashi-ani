# 💰 Минимальная настройка сервера для Next.js (дешёвый вариант)

## 📋 Требования к серверу

**Минимальная конфигурация:**
- CPU: 1 ядро
- RAM: 1GB (минимум) / 2GB (рекомендуется)
- Диск: 20GB SSD
- ОС: Ubuntu 22.04 LTS

**Стоимость:** примерно 200-300₽/месяц (зависит от провайдера)

## 🚀 Пошаговая установка

### Шаг 1: Создание сервера в reg.ru

1. Зайдите на https://www.reg.ru
2. VPS → Заказать новый сервер
3. Выберите:
   - **ОС:** Ubuntu 22.04 LTS
   - **CPU:** 1 ядро
   - **RAM:** 2GB (минимум 1GB, но лучше 2GB)
   - **Диск:** 20GB SSD
   - **Сеть:** 1TB трафика
4. **Важно при создании:**
   - Установите **СИЛЬНЫЙ пароль** (минимум 20 символов)
   - Или лучше: загрузите SSH ключ (безопаснее)

### Шаг 2: Первое подключение

```bash
# Подключитесь к серверу
ssh root@ВАШ_IP_АДРЕС

# Сразу обновите систему
apt update && apt upgrade -y

# Перезагрузите если нужно
# reboot
```

### Шаг 3: Настройка безопасности (ОБЯЗАТЕЛЬНО!)

```bash
# 1. Установите firewall и fail2ban
apt install -y ufw fail2ban

# 2. Настройте firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh      # SSH порт
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
ufw status

# 3. Настройте fail2ban (защита от брутфорса)
systemctl enable fail2ban
systemctl start fail2ban

# Создайте конфигурацию fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF

systemctl restart fail2ban
fail2ban-client status sshd

# 4. Измените порт SSH (рекомендуется)
nano /etc/ssh/sshd_config
# Найдите строку: #Port 22
# Измените на: Port 2222 (или любой другой порт)
# Сохраните: Ctrl+O, Enter, Ctrl+X

systemctl restart sshd

# 5. Обновите firewall для нового порта SSH
ufw allow 2222/tcp
ufw delete allow ssh
ufw status

# 6. Теперь подключайтесь через новый порт:
# ssh -p 2222 root@ВАШ_IP
```

### Шаг 4: Установка Node.js (минимальная версия)

```bash
# Установите Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверьте версию
node -v  # Должно быть v20.x.x
npm -v

# Установите PM2
npm install -g pm2
pm2 startup systemd -u root --hp /root
```

### Шаг 5: Установка Nginx

```bash
apt install -y nginx

# Создайте конфигурацию для сайта
cat > /etc/nginx/sites-available/tashi-ani << 'EOF'
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
ln -s /etc/nginx/sites-available/tashi-ani /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
nginx -t

# Запустите Nginx
systemctl enable nginx
systemctl restart nginx
```

### Шаг 6: Установка проекта

```bash
# 1. Перейдите в рабочую директорию
cd /var/www

# 2. Клонируйте проект (используйте HTTPS или SSH ключ)
git clone https://github.com/DGersmv/tashi-ani.git
cd tashi-ani

# 3. Создайте файл переменных окружения
nano .env.local

# Вставьте следующее (ЗАМЕНИТЕ на свои значения):
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="ЗАМЕНИТЕ_НА_СЛУЧАЙНУЮ_СТРОКУ_МИНИМУМ_32_СИМВОЛА_abcdefghijklmnopqrstuvwxyz1234567890"
MASTER_ADMIN_EMAIL="admin@227.info"
MASTER_ADMIN_PASSWORD="ВАШ_ПАРОЛЬ_АДМИНА"
EMAIL_USER="user@tashi-ani.ru"
EMAIL_PASS="ВАШ_ПАРОЛЬ_EMAIL"
NEXTAUTH_URL="https://tashi-ani.ru"
NODE_ENV="production"

# Сохраните: Ctrl+O, Enter, Ctrl+X

# 4. Установите зависимости
npm install

# 5. Создайте базу данных
npx prisma generate
npx prisma migrate deploy

# 6. Создайте админа
node create-admin-user.js

# 7. Соберите проект (может занять 3-5 минут)
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Если сборка убивается (Killed) - увеличьте swap:
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h

# Попробуйте собрать снова
npm run build
```

### Шаг 7: Запуск через PM2

```bash
# 1. Запустите приложение
pm2 start ecosystem.config.js

# 2. Сохраните конфигурацию PM2
pm2 save

# 3. Проверьте статус
pm2 status
pm2 logs tashi-ani --lines 20

# 4. Проверьте что приложение работает
curl http://localhost:3000
```

### Шаг 8: Установка SSL (HTTPS)

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Получите SSL сертификат
certbot --nginx -d tashi-ani.ru -d www.tashi-ani.ru

# Следуйте инструкциям:
# - Email: ваш email
# - Согласитесь с условиями (Y)
# - Redirect HTTP to HTTPS: выберите 2 (Redirect)

# Проверьте что сертификат установился
certbot certificates
```

### Шаг 9: Финальная проверка

```bash
# 1. Проверьте статус всех сервисов
systemctl status nginx
pm2 status
fail2ban-client status sshd

# 2. Проверьте firewall
ufw status

# 3. Проверьте память
free -h

# 4. Проверьте использование диска
df -h

# 5. Проверьте сайт в браузере
# https://tashi-ani.ru
```

## 💾 Оптимизация памяти (для 1GB RAM)

Если у вас только 1GB RAM, добавьте swap:

```bash
# Создайте swap 1GB
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Проверьте
free -h
```

## 🔧 Оптимизация сборки Next.js

Если сборка падает из-за памяти:

```bash
# В package.json добавьте в scripts:
"build": "NODE_OPTIONS='--max-old-space-size=512' next build"

# Или соберите локально и загрузите на сервер
```

## 📊 Мониторинг (опционально)

```bash
# Проверка памяти
watch -n 5 free -h

# Проверка процессов
htop  # Если установлен: apt install htop

# Логи приложения
pm2 logs tashi-ani
```

## ✅ Что получилось

- ✅ Безопасный сервер (firewall + fail2ban)
- ✅ Next.js приложение работает
- ✅ HTTPS настроен
- ✅ Автозапуск через PM2
- ✅ Минимальная стоимость (2GB RAM ~300₽/мес)

## 🆘 Если что-то не работает

1. **Сборка падает (Killed):** Увеличьте swap (Шаг 9)
2. **502 Bad Gateway:** Проверьте `pm2 status` и `pm2 logs`
3. **Не работает HTTPS:** Проверьте DNS записи для домена
4. **Не работает SSH:** Проверьте firewall: `ufw status`

## 🔒 Безопасность - проверка списком

- [ ] Firewall включен (ufw)
- [ ] Fail2ban настроен и работает
- [ ] SSH порт изменён (не 22)
- [ ] Сильный пароль или SSH ключи
- [ ] SSL сертификат установлен
- [ ] Система обновлена (apt update && apt upgrade)

