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

### Шаг 3: Настройка безопасности (КРИТИЧЕСКИ ВАЖНО!)

```bash
# 1. СРАЗУ после первого входа обновите систему
apt update && apt upgrade -y

# 2. Установите firewall и fail2ban
apt install -y ufw fail2ban

# 3. Настройте firewall (ЗАКРОЙТЕ ВСЁ КРОМЕ НУЖНОГО!)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh      # SSH порт (пока оставляем)
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
ufw status

# 4. Измените порт SSH (ОБЯЗАТЕЛЬНО! Используйте случайный порт, например 23456)
nano /etc/ssh/sshd_config

# Найдите и измените:
# Port 22  →  Port 23456 (или другой случайный порт)
# #PermitRootLogin yes  →  PermitRootLogin prohibit-password
# PasswordAuthentication yes  →  PasswordAuthentication no (ПОСЛЕ настройки SSH ключей!)
# PubkeyAuthentication yes  →  убедитесь что это раскомментировано

# Сохраните: Ctrl+O, Enter, Ctrl+X
systemctl restart sshd

# 5. Обновите firewall для нового порта SSH
ufw allow 23456/tcp
ufw delete allow ssh
ufw status

# 6. НАСТРОЙТЕ SSH КЛЮЧИ (ОБЯЗАТЕЛЬНО! Без этого будет небезопасно!)
# На вашей локальной машине (Windows):
# ssh-keygen -t ed25519 -C "your_email@example.com"
# скопируйте ~/.ssh/id_ed25519.pub

# На сервере создайте директорию и файл:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Вставьте ваш публичный ключ (одна строка)
chmod 600 ~/.ssh/authorized_keys

# Теперь попробуйте подключиться с ключом:
# ssh -p 23456 -i ~/.ssh/id_ed25519 root@ВАШ_IP

# После успешного подключения с ключом отключите пароли:
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart sshd

# 7. Настройте fail2ban (АГРЕССИВНЫЕ НАСТРОЙКИ!)
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 86400
findtime = 300
maxretry = 3
destemail = root@localhost
sendername = Fail2Ban
action = %(action_)s

[sshd]
enabled = true
port = 23456
filter = sshd
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 86400
findtime = 300
EOF

systemctl restart fail2ban
fail2ban-client status sshd

# 8. ОГРАНИЧЬТЕ ПОДКЛЮЧЕНИЯ К SSH (только с вашего IP)
# Узнайте свой IP: https://whatismyipaddress.com
# Замените YOUR_IP на ваш IP адрес:
ufw delete allow 23456/tcp
ufw allow from YOUR_IP to any port 23456 proto tcp

# 9. Настройте автоматическую очистку журналов (чтобы не засоряли диск)
cat > /etc/systemd/journald.conf << 'EOF'
[Journal]
SystemMaxUse=100M
SystemKeepFree=500M
MaxRetentionSec=7day
EOF

systemctl restart systemd-journald

# 10. Настройте мониторинг подозрительных процессов
cat > /root/check-security.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/security-check.log"

# Проверяем подозрительные процессы
SUSPICIOUS=$(ps aux | grep -E "(miner|crypto|xmrig|stratum|monero|bitcoin)" | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    echo "[$(date)] ВНИМАНИЕ: Обнаружены подозрительные процессы:" >> "$LOG_FILE"
    echo "$SUSPICIOUS" >> "$LOG_FILE"
    # Можно добавить отправку email или другие действия
fi

# Проверяем необычно высокую нагрузку CPU
HIGH_CPU=$(ps aux --sort=-%cpu | head -n 5 | awk 'NR>1 && $3>50 {print $0}')
if [ -n "$HIGH_CPU" ]; then
    echo "[$(date)] ВНИМАНИЕ: Высокая нагрузка CPU:" >> "$LOG_FILE"
    echo "$HIGH_CPU" >> "$LOG_FILE"
fi

# Проверяем автозапуск
UNKNOWN_CRON=$(crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$")
if [ -n "$UNKNOWN_CRON" ]; then
    echo "[$(date)] Проверьте cron задачи:" >> "$LOG_FILE"
    echo "$UNKNOWN_CRON" >> "$LOG_FILE"
fi
EOF

chmod +x /root/check-security.sh

# Добавьте в cron (проверка каждые 10 минут)
(crontab -l 2>/dev/null; echo "*/10 * * * * /root/check-security.sh") | crontab -

# 11. Проверьте что всё работает
echo "=== Проверка безопасности ==="
echo "Firewall:"
ufw status
echo ""
echo "Fail2ban:"
fail2ban-client status sshd
echo ""
echo "SSH конфигурация:"
grep -E "^(Port|PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config
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
# PostgreSQL от VK Cloud Managed Database
DATABASE_URL="postgresql://user:password@c-xxxxx.rw.mdb.yandexcloud.net:6432/tashi_ani_prod?sslmode=require"
# Получите строку подключения в панели VK Cloud после создания PostgreSQL инстанса
# См. подробную инструкцию: VK_CLOUD_DATABASE_MIGRATION.md
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
- [ ] Fail2ban настроен и работает (агрессивные настройки)
- [ ] SSH порт изменён (не 22, случайный порт)
- [ ] SSH ключи настроены и пароли ОТКЛЮЧЕНЫ
- [ ] SSH доступ только с вашего IP (whitelist)
- [ ] SSL сертификат установлен
- [ ] Система обновлена (apt update && apt upgrade)
- [ ] Мониторинг безопасности настроен
- [ ] Автоматическая очистка журналов настроена

## 🖥️ ВАЖНО: Проверьте локальный компьютер Windows!

**Майнер мог перебраться с вашего локального компьютера через SSH!**

Перед настройкой нового сервера:
1. Проверьте Windows антивирусом (полное сканирование)
2. Проверьте процессы на подозрительную активность
3. Проверьте SSH ключи - если нашли майнер, удалите старые ключи
4. Создайте новые SSH ключи

См. инструкцию: [CHECK_LOCAL_MACHINE.md](./CHECK_LOCAL_MACHINE.md)

## ⚠️ КРИТИЧЕСКИ ВАЖНО: Почему майнер проникал раньше

### Возможные причины проникновения:

1. **Пароли SSH вместо ключей** - брутфорс атаки
2. **Стандартный порт SSH (22)** - автоматические сканеры
3. **Fail2ban не работал или был слабо настроен** - не блокировал атаки
4. **SSH доступ открыт всем IP** - любой может пытаться подобрать пароль
5. **Система не обновлялась** - уязвимости в старых пакетах
6. **Нет мониторинга** - майнер запускался, но не был обнаружен

### Что теперь исправлено:

✅ **Только SSH ключи** - пароли полностью отключены
✅ **Случайный порт SSH** - не 22, а например 23456
✅ **Whitelist IP** - SSH доступ только с вашего IP
✅ **Агрессивный fail2ban** - блокирует после 3 попыток на 24 часа
✅ **Мониторинг процессов** - автоматическая проверка каждые 10 минут
✅ **Очистка журналов** - не засоряют диск
✅ **Обновление системы** - уязвимости закрыты

### После настройки безопасности проверьте:

```bash
# 1. Проверьте что пароли отключены
grep PasswordAuthentication /etc/ssh/sshd_config
# Должно быть: PasswordAuthentication no

# 2. Проверьте что работает только SSH ключи
grep PubkeyAuthentication /etc/ssh/sshd_config
# Должно быть: PubkeyAuthentication yes

# 3. Проверьте fail2ban
fail2ban-client status sshd
# Должны быть заблокированные IP если были попытки

# 4. Проверьте firewall
ufw status
# Должен быть разрешён только ваш IP на SSH порт

# 5. Проверьте мониторинг
cat /var/log/security-check.log
# Логи проверок безопасности

# 6. Ежедневно проверяйте процессы
ps aux | grep -E "(miner|crypto|xmrig)" | grep -v grep
# Должно быть пусто!
```

### Если майнер снова появится:

1. **Сразу убейте процесс**: `ps aux | grep -E "(miner|crypto)"`
2. **Найдите файл**: `find / -name "*подозрительное_имя*"`
3. **Проверьте автозапуск**: `crontab -l`, `systemctl list-units`
4. **Удалите файл и автозапуск**
5. **Проверьте логи**: `/var/log/auth.log`, `/var/log/security-check.log`
6. **Заблокируйте IP** в firewall если видите атаку

**Главное правило:** Без SSH ключей + без whitelist IP = сервер будет взломан снова!

