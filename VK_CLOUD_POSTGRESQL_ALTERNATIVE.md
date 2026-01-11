# 💰 Альтернатива: PostgreSQL на сервере (бесплатно!)

## ⚠️ Проблема с Managed PostgreSQL

Managed PostgreSQL от VK Cloud стоит **~5000₽/месяц** даже за минимальную конфигурацию - это слишком дорого для небольшого проекта.

## ✅ Решение: Установить PostgreSQL на ваш сервер

**Преимущества:**
- ✅ **Бесплатно** - платите только за сервер (который уже есть)
- ✅ **Полный контроль** - настраиваете как нужно
- ✅ **Нет ограничений** - используете все ресурсы сервера

**Недостатки:**
- ⚠️ Нужно делать бэкапы вручную (но это легко автоматизировать)
- ⚠️ Нужно следить за обновлениями безопасности

## 🚀 Установка PostgreSQL на сервер VK Cloud

### ⚠️ ВАЖНО: Сначала подключитесь к серверу!

**Вы не можете выполнять команды в веб-консоли VK Cloud!**

Нужно подключиться через **SSH** (командная строка).

**Как подключиться:**
1. Откройте **PowerShell** или **CMD** на вашем Windows компьютере
2. Выполните команду подключения (см. ниже)
3. После подключения вы увидите командную строку сервера

**Подробная инструкция по подключению:** [SSH_CONNECTION_GUIDE.md](./SSH_CONNECTION_GUIDE.md)

### Шаг 1: Подключение к серверу

```powershell
# На вашем Windows компьютере (PowerShell):
# Замените IP адрес на ваш!

# Если порт стандартный (22):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@ВАШ_IP_АДРЕС

# Если порт изменён (например, 23456):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem -p 23456 ubuntu@ВАШ_IP_АДРЕС

# Пример (если ваш IP 87.239.108.115, порт 22):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@87.239.108.115

# Пример (если порт 23456):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem -p 23456 ubuntu@87.239.108.115
```

**После подключения** вы увидите что-то вроде:
```
Welcome to Ubuntu 22.04 LTS
ubuntu@server-name:~$
```

**Теперь вы в командной строке сервера!** Можете выполнять команды.

### Шаг 2: Установка PostgreSQL

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Проверьте версию
psql --version
```

### Шаг 2: Настройка PostgreSQL

```bash
# Переключитесь на пользователя postgres
sudo -u postgres psql

# В psql выполните:
CREATE DATABASE tashi_ani_prod;
CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_СИЛЬНЫЙ_ПАРОЛЬ_МИНИМУМ_16_СИМВОЛОВ';
GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;
\q
```

### Шаг 3: Настройка доступа

```bash
# Отредактируйте конфигурацию PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf

# Найдите и раскомментируйте/измените:
listen_addresses = 'localhost'  # Для безопасности - только localhost

# Настройте pg_hba.conf для доступа
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Добавьте в конец файла:
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   tashi_ani_prod  tashi_ani_user                          md5
host    tashi_ani_prod  tashi_ani_user  127.0.0.1/32            md5

# Перезапустите PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Проверьте что работает
sudo systemctl status postgresql
```

### Шаг 4: Обновление .env.local

```bash
cd /var/www/tashi-ani
nano .env.local

# Измените DATABASE_URL на:
DATABASE_URL="postgresql://tashi_ani_user:ВАШ_ПАРОЛЬ@localhost:5432/tashi_ani_prod"
```

### Шаг 5: Применение миграций

```bash
# Сгенерируйте Prisma Client
npx prisma generate

# Примените миграции
npx prisma migrate deploy

# Если есть данные в SQLite - мигрируйте их
npm run db:migrate-data

# Пересоберите проект
npm run build

# Перезапустите
pm2 restart tashi-ani
```

## 🔒 Безопасность

### Ограничение доступа

PostgreSQL будет доступен только с localhost (127.0.0.1), что безопасно:
- Внешние подключения невозможны
- Доступ только с вашего сервера
- Приложение подключается через localhost

### Настройка firewall (уже настроен)

Firewall уже настроен в VK_CLOUD_SETUP.md и не пропускает порт 5432 извне - это правильно!

## 💾 Автоматические бэкапы

### Создайте скрипт бэкапа

```bash
# Создайте директорию для бэкапов
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql

# Создайте скрипт бэкапа
sudo nano /usr/local/bin/postgres-backup.sh
```

Вставьте:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tashi_ani_prod"
DB_USER="tashi_ani_user"

# Создайте бэкап
sudo -u postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Удалите бэкапы старше 7 дней
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Сделайте скрипт исполняемым
sudo chmod +x /usr/local/bin/postgres-backup.sh

# Добавьте в cron (ежедневно в 2:00)
sudo crontab -e
# Добавьте строку:
0 2 * * * /usr/local/bin/postgres-backup.sh
```

## 📊 Мониторинг

### Проверка использования

```bash
# Размер базы данных
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('tashi_ani_prod'));"

# Количество подключений
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'tashi_ani_prod';"

# Медленные запросы
sudo -u postgres psql -d tashi_ani_prod -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

## 🔄 Обновление PostgreSQL

```bash
# Проверьте доступные обновления
sudo apt update
sudo apt list --upgradable | grep postgresql

# Обновите (если есть обновления)
sudo apt upgrade postgresql postgresql-contrib

# Перезапустите
sudo systemctl restart postgresql
```

## ✅ Преимущества этого подхода

1. **Экономия:** 0₽ дополнительно (используете ресурсы существующего сервера)
2. **Производительность:** PostgreSQL на том же сервере = минимальная задержка
3. **Контроль:** Полный контроль над конфигурацией
4. **Простота:** Не нужно настраивать внешние подключения

## 🆘 Решение проблем

### PostgreSQL не запускается

```bash
# Проверьте логи
sudo journalctl -u postgresql -n 50

# Проверьте конфигурацию
sudo -u postgres /usr/lib/postgresql/*/bin/postgres --check-config
```

### Не могу подключиться

```bash
# Проверьте что PostgreSQL слушает
sudo netstat -tlnp | grep 5432

# Проверьте права доступа
sudo -u postgres psql -c "\du"
```

### Нехватка места на диске

```bash
# Проверьте размер базы
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('tashi_ani_prod'));"

# Очистите старые бэкапы
sudo find /var/backups/postgresql -name "*.sql.gz" -mtime +30 -delete
```

## 📝 Итог

**Вместо Managed PostgreSQL за 5000₽/мес:**
- ✅ Установите PostgreSQL на сервер (бесплатно)
- ✅ Настройте автоматические бэкапы
- ✅ Используйте ресурсы существующего сервера

**Экономия: 5000₽/месяц!** 💰

