# 🚨 ПОЛНАЯ ПЕРЕУСТАНОВКА СЕРВЕРА REG.RU

## ⚠️ ВАЖНО: Обнаружен майнер/вирус - нужна полная очистка

---

## 📋 ЭТАП 1: ПОДГОТОВКА ЛОКАЛЬНОГО ПРОЕКТА (на вашем компьютере)

### 1.1 Проверка локального проекта на вирусы

```powershell
# Проверьте проект антивирусом
# Убедитесь, что на вашем компьютере нет вирусов

# Проверьте подозрительные файлы
Get-ChildItem -Recurse -File | Where-Object {
    $_.Name -match "(boatnet|yamaha|broncano|miner|\.x86_64|\.sh$)" -or
    $_.Extension -match "\.(sh|bat|exe|bin)$"
} | Select-Object FullName
```

### 1.2 Создание чистого архива проекта

```powershell
# Убедитесь, что вы в директории проекта
cd E:\tashi-ani

# Создайте чистый архив БЕЗ подозрительных файлов
# Исключите: node_modules, .next, .git, логи, базы данных, загруженные файлы
Compress-Archive -Path `
    src,public,prisma/schema.prisma,prisma/migrations,package.json,package-lock.json,next.config.js,tailwind.config.js,postcss.config.js,tsconfig.json,ecosystem.config.js `
    -DestinationPath tashi-ani-clean.zip `
    -Force

# ИЛИ используйте Git для создания чистого архива
git archive --format=zip --output=tashi-ani-clean.zip HEAD
```

### 1.3 Проверка архива

```powershell
# Откройте архив и проверьте, что в нем только нужные файлы
# НЕ должно быть:
# - node_modules
# - .next
# - *.log
# - prisma/dev.db
# - public/uploads/* (загруженные файлы)
# - подозрительных .sh, .exe файлов
```

---

## 📋 ЭТАП 2: ПОЛНАЯ ОЧИСТКА СЕРВЕРА REG.RU

### 2.1 Подключение к серверу

**Вариант A: Через веб-консоль reg.ru (РЕКОМЕНДУЕТСЯ)**
1. Зайдите в панель управления reg.ru
2. Найдите ваш VPS сервер (IP: 89.104.67.209)
3. Откройте "Веб-консоль" или "VNC консоль"
4. Войдите как root

**Вариант B: Через SSH (если доступен)**
```bash
ssh root@89.104.67.209
```

### 2.2 Остановка всех процессов

```bash
# Остановите PM2
pm2 stop all
pm2 delete all

# Остановите все Node.js процессы
pkill -f node
pkill -f npm

# Проверьте, что процессы остановлены
ps aux | grep -E "(node|npm|pm2)"
```

### 2.3 Поиск и удаление вирусов/майнеров

```bash
# 1. Найдите подозрительные процессы
ps aux | grep -E "(miner|boatnet|yamaha|broncano|xmrig|cpuminer)"

# 2. Найдите подозрительные файлы
find / -name "*boatnet*" -o -name "*yamaha*" -o -name "*broncano*" 2>/dev/null
find / -name "*.x86_64" -type f 2>/dev/null
find / -name "*miner*" -type f 2>/dev/null

# 3. Проверьте cron задачи (часто вирусы добавляют себя в cron)
crontab -l
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.hourly/
ls -la /etc/cron.daily/

# 4. Проверьте автозагрузку
ls -la /etc/init.d/
ls -la /etc/systemd/system/

# 5. Проверьте сетевые соединения
netstat -tulpn | grep -E "(50\.6\.248\.160|suspicious_ip)"
ss -tulpn | grep -E "(suspicious_port)"
```

### 2.4 Удаление проекта (старая версия)

```bash
# Удалите старую директорию проекта
rm -rf /var/www/tashi-ani
rm -rf /var/www/html/tashi-ani
rm -rf /home/*/tashi-ani

# Удалите старые логи
rm -rf /var/www/tashi-ani/logs
rm -rf ~/.pm2/logs/*

# Очистите кеш npm
npm cache clean --force
```

### 2.5 Очистка системы от вирусов

```bash
# 1. Удалите найденные вирусы
# (замените пути на реальные найденные файлы)
# rm -f /path/to/virus/file

# 2. Очистите cron задачи (ОСТОРОЖНО! Удалите только подозрительные)
# crontab -e
# Удалите строки с подозрительными командами

# 3. Проверьте и удалите подозрительные сервисы
systemctl list-units --type=service | grep -E "(suspicious|miner)"
# systemctl stop suspicious_service
# systemctl disable suspicious_service

# 4. Проверьте автозагрузку
cat ~/.bashrc | grep -E "(curl|wget|\.sh)"
cat ~/.bash_profile | grep -E "(curl|wget|\.sh)"
```

### 2.6 Блокировка подозрительных IP

```bash
# Заблокируйте подозрительные IP через iptables
# (замените IP на реальный подозрительный IP)
iptables -A INPUT -s 50.6.248.160 -j DROP
iptables -A OUTPUT -d 50.6.248.160 -j DROP

# Или через ufw (если установлен)
ufw deny from 50.6.248.160
```

### 2.7 Обновление системы и установка защиты

```bash
# Обновите систему
apt update
apt upgrade -y

# Установите fail2ban для защиты от брутфорса
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban

# Установите ufw (firewall)
apt install ufw -y
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 📋 ЭТАП 3: УСТАНОВКА ЧИСТОГО ПРОЕКТА

### 3.1 Создание новой директории проекта

```bash
# Создайте новую директорию
mkdir -p /var/www/tashi-ani
cd /var/www/tashi-ani

# Установите правильные права
chown -R $USER:$USER /var/www/tashi-ani
chmod 755 /var/www/tashi-ani
```

### 3.2 Загрузка чистого проекта

**Вариант A: Через веб-интерфейс reg.ru**
1. Загрузите `tashi-ani-clean.zip` через файловый менеджер
2. Распакуйте в `/var/www/tashi-ani/`

**Вариант B: Через SCP (с вашего компьютера)**
```powershell
# На вашем компьютере (PowerShell)
scp tashi-ani-clean.zip root@89.104.67.209:/var/www/tashi-ani/
```

**Вариант C: Через Git (если репозиторий чистый)**
```bash
# На сервере
cd /var/www/tashi-ani
git clone https://your-repo-url.git .
# ИЛИ если уже есть репозиторий
git pull origin master
```

### 3.3 Распаковка проекта

```bash
cd /var/www/tashi-ani

# Распакуйте архив
unzip tashi-ani-clean.zip
# ИЛИ
tar -xzf tashi-ani-clean.tar.gz

# Убедитесь, что все файлы на месте
ls -la
```

### 3.4 Установка зависимостей

```bash
cd /var/www/tashi-ani

# Проверьте версию Node.js (должна быть 18+)
node --version
npm --version

# Если Node.js не установлен или старая версия
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Установите зависимости
npm install --production

# Сгенерируйте Prisma клиент
npx prisma generate
```

### 3.5 Настройка базы данных

```bash
# Вариант A: SQLite (проще для начала)
cd /var/www/tashi-ani
mkdir -p prisma
# База данных будет создана автоматически при первом запуске

# Вариант B: PostgreSQL (рекомендуется для продакшна)
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql

# Создайте базу данных
sudo -u postgres psql << EOF
CREATE DATABASE tashi_ani_prod;
CREATE USER tashi_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_user;
\q
EOF
```

### 3.6 Создание .env.local

```bash
cd /var/www/tashi-ani
nano .env.local
```

**Вставьте следующее содержимое (замените на свои реальные данные):**

```env
# База данных
# Для SQLite:
DATABASE_URL="file:./prisma/prod.db"
# Для PostgreSQL:
# DATABASE_URL="postgresql://tashi_user:your_secure_password@localhost:5432/tashi_ani_prod"

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
```

**Сохраните файл:** `Ctrl+X`, затем `Y`, затем `Enter`

### 3.7 Применение миграций базы данных

```bash
cd /var/www/tashi-ani

# Примените миграции
npx prisma migrate deploy

# ИЛИ если используете SQLite и нужно создать базу с нуля
npx prisma db push
```

### 3.8 Создание директорий для загрузок

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

### 3.9 Сборка проекта

```bash
cd /var/www/tashi-ani

# Соберите проект
npm run build

# Проверьте, что сборка прошла успешно
ls -la .next
```

---

## 📋 ЭТАП 4: ЗАПУСК ПРИЛОЖЕНИЯ

### 4.1 Установка PM2

```bash
# Установите PM2 глобально
npm install -g pm2

# Проверьте установку
pm2 --version
```

### 4.2 Настройка PM2

```bash
cd /var/www/tashi-ani

# PM2 уже должен использовать ecosystem.config.js
# Проверьте, что файл существует
cat ecosystem.config.js
```

### 4.3 Запуск приложения

```bash
cd /var/www/tashi-ani

# Запустите приложение
pm2 start ecosystem.config.js

# Сохраните конфигурацию PM2
pm2 save

# Настройте автозапуск при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет pm2 startup

# Проверьте статус
pm2 status
pm2 logs tashi-ani --lines 50
```

### 4.4 Настройка Nginx (если используется)

```bash
# Проверьте, установлен ли Nginx
nginx -v

# Если не установлен
apt install nginx -y

# Создайте конфигурацию
nano /etc/nginx/sites-available/tashi-ani
```

**Вставьте следующую конфигурацию:**

```nginx
server {
    listen 80;
    server_name tashi-ani.ru www.tashi-ani.ru;

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
    }
}
```

**Активируйте конфигурацию:**

```bash
# Создайте симлинк
ln -s /etc/nginx/sites-available/tashi-ani /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезапустите Nginx
systemctl restart nginx
```

### 4.5 Настройка SSL (рекомендуется)

```bash
# Установите Certbot
apt install certbot python3-certbot-nginx -y

# Получите SSL сертификат
certbot --nginx -d tashi-ani.ru -d www.tashi-ani.ru

# Certbot автоматически обновит конфигурацию Nginx
```

---

## 📋 ЭТАП 5: ПРОВЕРКА И БЕЗОПАСНОСТЬ

### 5.1 Проверка работы сайта

```bash
# Проверьте, что приложение запущено
pm2 status

# Проверьте логи
pm2 logs tashi-ani --lines 100

# Проверьте доступность сайта
curl http://localhost:3000
```

### 5.2 Проверка на вирусы после установки

```bash
# Проверьте процессы
ps aux | grep -E "(miner|boatnet|yamaha|broncano)"

# Проверьте файлы проекта
find /var/www/tashi-ani -name "*.sh" -o -name "*.exe" -o -name "*.bin"

# Проверьте cron задачи
crontab -l
cat /etc/crontab

# Проверьте сетевые соединения
netstat -tulpn | grep -v "127.0.0.1"
```

### 5.3 Настройка мониторинга

```bash
# Установите мониторинг процессов
pm2 install pm2-logrotate

# Настройте ротацию логов
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 5.4 Создание резервной копии

```bash
# Создайте скрипт для автоматического бэкапа
nano /var/www/tashi-ani/backup.sh
```

**Содержимое скрипта:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/tashi-ani"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
if [ -f "/var/www/tashi-ani/prisma/prod.db" ]; then
    cp /var/www/tashi-ani/prisma/prod.db $BACKUP_DIR/db_$DATE.db
fi

# Бэкап загруженных файлов
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/tashi-ani/public/uploads

# Удалите старые бэкапы (старше 30 дней)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Сделайте скрипт исполняемым:**

```bash
chmod +x /var/www/tashi-ani/backup.sh

# Добавьте в cron для ежедневного бэкапа
crontab -e
# Добавьте строку:
# 0 2 * * * /var/www/tashi-ani/backup.sh >> /var/log/tashi-ani-backup.log 2>&1
```

---

## 📋 ЭТАП 6: ВОССТАНОВЛЕНИЕ ДАННЫХ (если есть бэкап)

### 6.1 Восстановление базы данных

```bash
# Если у вас есть бэкап базы данных
cp /path/to/backup/db_backup.db /var/www/tashi-ani/prisma/prod.db
chmod 644 /var/www/tashi-ani/prisma/prod.db
```

### 6.2 Восстановление загруженных файлов

```bash
# Если у вас есть бэкап загруженных файлов
tar -xzf /path/to/backup/uploads_backup.tar.gz -C /var/www/tashi-ani/public/
chmod -R 755 /var/www/tashi-ani/public/uploads
```

---

## ✅ ЧЕКЛИСТ ПОСЛЕ УСТАНОВКИ

- [ ] Сервер полностью очищен от вирусов
- [ ] Все подозрительные процессы остановлены
- [ ] Проект загружен и распакован
- [ ] Зависимости установлены (`npm install`)
- [ ] База данных настроена и миграции применены
- [ ] Файл `.env.local` создан с правильными данными
- [ ] Проект собран (`npm run build`)
- [ ] PM2 запущен и приложение работает
- [ ] Nginx настроен и работает
- [ ] SSL сертификат установлен
- [ ] Сайт открывается в браузере
- [ ] Авторизация работает
- [ ] Админ-панель доступна
- [ ] Загрузка файлов работает
- [ ] Настроен автоматический бэкап
- [ ] Настроен мониторинг (fail2ban, ufw)

---

## 🆘 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Проблема: Сайт не открывается

```bash
# Проверьте статус PM2
pm2 status

# Проверьте логи
pm2 logs tashi-ani --lines 100

# Проверьте, что порт 3000 слушается
netstat -tulpn | grep 3000

# Проверьте Nginx
systemctl status nginx
nginx -t
```

### Проблема: Ошибки базы данных

```bash
# Проверьте подключение к базе
npx prisma studio

# Проверьте миграции
npx prisma migrate status

# Примените миграции заново
npx prisma migrate deploy
```

### Проблема: Ошибки при сборке

```bash
# Очистите кеш
rm -rf .next
rm -rf node_modules
npm cache clean --force

# Переустановите зависимости
npm install

# Попробуйте собрать снова
npm run build
```

---

## 🔒 РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ

1. **Регулярно обновляйте систему:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Используйте сложные пароли** для всех сервисов

3. **Регулярно проверяйте логи:**
   ```bash
   pm2 logs tashi-ani
   tail -f /var/log/nginx/error.log
   ```

4. **Настройте автоматические бэкапы**

5. **Ограничьте SSH доступ** (используйте ключи вместо паролей)

6. **Регулярно проверяйте процессы:**
   ```bash
   ps aux | sort -k3 -rn | head -10  # Топ процессов по CPU
   ```

7. **Мониторьте использование ресурсов:**
   ```bash
   htop
   df -h  # Использование диска
   free -h  # Использование памяти
   ```

---

## 📞 ПОДДЕРЖКА

Если возникли проблемы:
1. Проверьте логи: `pm2 logs tashi-ani`
2. Проверьте статус: `pm2 status`
3. Проверьте конфигурацию Nginx: `nginx -t`
4. Обратитесь в поддержку reg.ru при необходимости





