# 🔌 Как подключиться к серверу VK Cloud через SSH

## ⚠️ Важно: Разница между веб-консолью и SSH

- **Веб-консоль VK Cloud** (https://mcs.mail.ru) - это панель управления, где вы создаёте серверы
- **SSH подключение** - это доступ к командной строке вашего сервера (где выполняются команды)

## 🚀 Подключение к серверу через SSH

### Шаг 1: Проверьте ваш SSH ключ

У вас должен быть ключ:
- **Путь на Windows:** `C:\Users\DGer\.ssh\tashi-ani.pem`

Проверьте что ключ существует:

```powershell
# Проверьте наличие ключа
Test-Path C:\Users\DGer\.ssh\tashi-ani.pem

# Если есть - отлично! Если нет - см. ниже
```

### Шаг 2: Если ключа нет - создайте его

```powershell
# В PowerShell на Windows:
ssh-keygen -t ed25519 -C "tashi-ani-server" -f C:\Users\DGer\.ssh\tashi-ani.pem

# Или если нужен RSA ключ:
ssh-keygen -t rsa -b 4096 -C "tashi-ani-server" -f C:\Users\DGer\.ssh\tashi-ani.pem
```

### Шаг 3: Добавьте ключ в VK Cloud

1. Откройте публичный ключ:
   ```powershell
   # Если у вас .pem файл, попробуйте:
   Get-Content C:\Users\DGer\.ssh\tashi-ani.pem.pub
   
   # Или если публичный ключ в другом формате:
   Get-Content C:\Users\DGer\.ssh\tashi-ani.pub
   ```
2. Скопируйте весь вывод (начинается с `ssh-ed25519` или `ssh-rsa`)
3. Зайдите на https://mcs.mail.ru
4. Перейдите в **"Ключи"** или **"SSH Keys"**
5. Нажмите **"Добавить ключ"** и вставьте публичный ключ

**Важно:** Если у вас только `.pem` файл (приватный ключ), вам нужен публичный ключ (`.pub`). Если его нет, создайте новый ключ (см. выше).

### Шаг 3: Узнайте IP адрес вашего сервера

1. Зайдите на https://mcs.mail.ru
2. Перейдите в **"Виртуальные машины"** или **"Compute"**
3. Найдите ваш сервер
4. Скопируйте **IP адрес** (например: `87.239.108.115`)

### Шаг 4: Подключитесь через SSH

#### На Windows (PowerShell или CMD):

```powershell
# Установите права на ключ (только первый раз)
icacls C:\Users\DGer\.ssh\tashi-ani.pem /inheritance:r
icacls C:\Users\DGer\.ssh\tashi-ani.pem /grant:r "%USERNAME%:R"

# Подключитесь к серверу
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@ВАШ_IP_АДРЕС

# Если SSH порт изменён (например, 23456):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem -p 23456 ubuntu@ВАШ_IP_АДРЕС
```

**Замените:**
- `ВАШ_IP_АДРЕС` на IP вашего сервера (например: `87.239.108.115`)
- `23456` на ваш SSH порт (если вы его меняли, или используйте `22` если не меняли)

#### Пример реальной команды:

```powershell
# Если порт стандартный (22):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@87.239.108.115

# Если порт изменён (например, 23456):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem -p 23456 ubuntu@87.239.108.115
```

### Шаг 5: Вы в командной строке сервера!

После успешного подключения вы увидите что-то вроде:

```
Welcome to Ubuntu 22.04 LTS
ubuntu@server-name:~$
```

Теперь вы можете выполнять команды на сервере!

## 📝 Пример: Установка PostgreSQL

После подключения через SSH выполните:

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Создайте базу данных
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"

# Создайте пользователя
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_СИЛЬНЫЙ_ПАРОЛЬ';"

# Дайте права
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"
```

## 🔧 Альтернативные способы подключения

### Способ 1: PuTTY (для Windows, если SSH не работает)

1. Скачайте PuTTY: https://www.putty.org/
2. Откройте PuTTY
3. В **Host Name** введите: `ubuntu@ВАШ_IP_АДРЕС`
4. В **Port** введите: `22` (или ваш порт, например `23456`)
5. В **Connection → SSH → Auth** укажите путь к приватному ключу
6. Нажмите **Open**

### Способ 2: Windows Terminal (рекомендуется)

1. Установите Windows Terminal из Microsoft Store
2. Откройте Windows Terminal
3. Используйте те же команды SSH что выше

### Способ 3: VS Code Remote SSH

1. Установите расширение "Remote - SSH" в VS Code
2. Нажмите F1 → "Remote-SSH: Connect to Host"
3. Введите: `ubuntu@ВАШ_IP_АДРЕС`
4. Выберите конфигурацию SSH

## ❌ Частые проблемы

### Проблема: "Permission denied (publickey)"

**Решение:**
1. Проверьте что ключ добавлен в VK Cloud (публичный ключ!)
2. Проверьте путь к ключу:
   ```powershell
   Test-Path C:\Users\DGer\.ssh\tashi-ani.pem
   ```
3. Проверьте права на ключ:
   ```powershell
   icacls C:\Users\DGer\.ssh\tashi-ani.pem
   ```
4. Установите права заново:
   ```powershell
   icacls C:\Users\DGer\.ssh\tashi-ani.pem /inheritance:r
   icacls C:\Users\DGer\.ssh\tashi-ani.pem /grant:r "%USERNAME%:R"
   ```
5. **ВАЖНО:** Убедитесь что публичный ключ добавлен в VK Cloud, а не приватный (.pem)!

### Проблема: "Connection refused"

**Решение:**
1. Проверьте что сервер запущен в VK Cloud
2. Проверьте правильность IP адреса
3. Проверьте правильность порта SSH
4. Проверьте firewall на сервере

### Проблема: "Host key verification failed"

**Решение:**
```powershell
# Удалите старый ключ хоста
ssh-keygen -R ВАШ_IP_АДРЕС
```

### Проблема: Не могу найти файл ключа

**Решение:**
```powershell
# Проверьте что ключ существует
Test-Path C:\Users\DGer\.ssh\tashi-ani.pem

# Посмотрите все файлы в директории
Get-ChildItem C:\Users\DGer\.ssh\

# Если ключа нет - создайте заново
ssh-keygen -t ed25519 -C "tashi-ani-server" -f C:\Users\DGer\.ssh\tashi-ani.pem
```

## ✅ Проверка подключения

После подключения проверьте:

```bash
# Кто вы?
whoami
# Должно быть: ubuntu

# Где вы?
pwd
# Должно быть: /home/ubuntu

# Проверьте версию Ubuntu
lsb_release -a

# Проверьте что можете выполнять команды
sudo -v
```

## 📚 Полезные команды после подключения

```bash
# Посмотреть использование диска
df -h

# Посмотреть использование памяти
free -h

# Посмотреть запущенные процессы
ps aux

# Посмотреть логи
sudo journalctl -n 50

# Выйти из SSH
exit
```

## 🎯 Быстрая шпаргалка

**Подключение:**
```powershell
# Стандартный порт (22):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@87.239.108.115

# Если порт изменён (например, 23456):
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem -p 23456 ubuntu@87.239.108.115
```

**После подключения - установка PostgreSQL:**
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ПАРОЛЬ';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"
```

## 🆘 Если ничего не помогает

1. Проверьте что сервер запущен в панели VK Cloud
2. Проверьте что SSH порт открыт в firewall
3. Попробуйте подключиться с другого компьютера
4. Проверьте логи в панели VK Cloud
5. Создайте новый SSH ключ и добавьте его в VK Cloud

