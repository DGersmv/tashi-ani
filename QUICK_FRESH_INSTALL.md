# ⚡ БЫСТРАЯ ПЕРЕУСТАНОВКА UBUNTU

## 🎯 Краткая инструкция для опытных

---

## 1️⃣ Переустановка Ubuntu через reg.ru

1. Зайдите в панель reg.ru → VPS → Ваш сервер
2. Нажмите "Переустановка ОС"
3. Выберите **Ubuntu 22.04 LTS**
4. Установите пароль root
5. Подтвердите переустановку
6. Дождитесь завершения (5-10 минут)

---

## 2️⃣ Первоначальная настройка

```bash
# Подключитесь к серверу (через веб-консоль reg.ru или SSH)
ssh root@89.104.67.209

# Обновите систему
apt update && apt upgrade -y

# Установите базовые утилиты
apt install -y curl wget git nano ufw fail2ban htop

# Настройте firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Запустите fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 3️⃣ Установка Node.js и PM2

```bash
# Установите Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установите PM2
npm install -g pm2

# Настройте автозапуск PM2
pm2 startup
# Выполните команду, которую выведет pm2 startup
```

---

## 4️⃣ Установка Nginx

```bash
# Установите Nginx
apt install -y nginx

# Создайте конфигурацию
nano /etc/nginx/sites-available/tashi-ani
```

**Вставьте:**
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

```bash
# Активируйте конфигурацию
ln -s /etc/nginx/sites-available/tashi-ani /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 5️⃣ Установка проекта из GitHub

```bash
# Создайте директорию
mkdir -p /var/www/tashi-ani
cd /var/www/tashi-ani

# Клонируйте репозиторий
git clone https://github.com/your-username/tashi-ani.git .

# Установите зависимости
npm install
npx prisma generate

# Создайте .env.local
nano .env.local
```

**Вставьте:**
```env
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="your-super-secret-jwt-key-change-this"
MASTER_ADMIN_EMAIL="2277277@bk.ru"
MASTER_ADMIN_PASSWORD="admin123"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-password"
NEXTAUTH_URL="https://tashi-ani.ru"
NODE_ENV="production"
```

```bash
# Примените миграции
npx prisma migrate deploy || npx prisma db push

# Создайте директории
mkdir -p public/uploads/objects public/uploads/projects logs
chmod 755 public/uploads public/uploads/objects public/uploads/projects

# Соберите проект
npm run build

# Запустите через PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## 6️⃣ SSL сертификат

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Получите SSL сертификат
certbot --nginx -d tashi-ani.ru -d www.tashi-ani.ru
```

---

## 7️⃣ Настройка обновления из GitHub

```bash
cd /var/www/tashi-ani

# Скопируйте скрипт обновления
cp scripts/update-from-github.sh .
chmod +x update-from-github.sh

# Протестируйте обновление
./update-from-github.sh
```

---

## ✅ Готово!

Теперь для обновления сайта просто выполните:
```bash
cd /var/www/tashi-ani
./update-from-github.sh
```

---

## 📖 Подробная инструкция

См. файл **FRESH_UBUNTU_INSTALL.md** для полной пошаговой инструкции.




