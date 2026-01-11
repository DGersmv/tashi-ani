# ⚡ Быстрое подключение к серверу

## 🎯 Ваш ключ: `tashi-ani.pem`

## 📝 Пошаговая инструкция

### 1. Откройте PowerShell на Windows

Нажмите `Win + X` → выберите **Windows PowerShell** или **Terminal**

### 2. Установите права на ключ (только первый раз)

```powershell
icacls C:\Users\DGer\.ssh\tashi-ani.pem /inheritance:r
icacls C:\Users\DGer\.ssh\tashi-ani.pem /grant:r "%USERNAME%:R"
```

### 3. Подключитесь к серверу

**Узнайте IP адрес вашего сервера:**
1. Зайдите на https://mcs.mail.ru
2. Перейдите в **"Виртуальные машины"** или **"Compute"**
3. Найдите ваш сервер
4. Скопируйте **IP адрес**

**Подключитесь:**

```powershell
# Если порт стандартный (22) - попробуйте сначала это:
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@ВАШ_IP_АДРЕС

# Если не работает, попробуйте с портом 23456:
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem -p 23456 ubuntu@ВАШ_IP_АДРЕС
```

**Пример (замените на ваш IP):**
```powershell
ssh -i C:\Users\DGer\.ssh\tashi-ani.pem ubuntu@87.239.108.115
```

### 4. Если появится предупреждение о хосте - нажмите `yes`

Вы увидите что-то вроде:
```
The authenticity of host '87.239.108.115' can't be established.
Are you sure you want to continue connecting (yes/no/[fingerprint])? 
```
Напишите `yes` и нажмите Enter.

### 5. Вы подключены!

После успешного подключения вы увидите:
```
Welcome to Ubuntu 22.04 LTS
ubuntu@server-name:~$
```

**Теперь вы в командной строке сервера!** Можете выполнять команды.

## ❌ Если не получается подключиться

### Ошибка: "Permission denied (publickey)"

**Проблема:** Публичный ключ не добавлен в VK Cloud или неправильный ключ.

**Решение:**
1. Проверьте что у вас есть публичный ключ:
   ```powershell
   # Попробуйте найти публичный ключ:
   Get-ChildItem C:\Users\DGer\.ssh\ | Where-Object {$_.Name -like "*tashi-ani*"}
   ```

2. Если есть файл `tashi-ani.pem.pub` или `tashi-ani.pub`:
   ```powershell
   Get-Content C:\Users\DGer\.ssh\tashi-ani.pem.pub
   # Или
   Get-Content C:\Users\DGer\.ssh\tashi-ani.pub
   ```

3. Скопируйте весь вывод (начинается с `ssh-ed25519` или `ssh-rsa`)

4. Добавьте в VK Cloud:
   - Зайдите на https://mcs.mail.ru
   - **Ключи** → **Добавить ключ**
   - Вставьте публичный ключ
   - Сохраните

5. Если публичного ключа нет - создайте новый:
   ```powershell
   ssh-keygen -t ed25519 -C "tashi-ani-server" -f C:\Users\DGer\.ssh\tashi-ani-new
   ```
   Затем добавьте `tashi-ani-new.pub` в VK Cloud.

### Ошибка: "Connection refused" или "Connection timed out"

**Проблема:** Неправильный IP, порт закрыт, или сервер не запущен.

**Решение:**
1. Проверьте что сервер запущен в панели VK Cloud
2. Проверьте правильность IP адреса
3. Попробуйте разные порты: `22`, `23456`, `2222`
4. Проверьте firewall на сервере (если есть доступ через веб-консоль)

### Ошибка: "Could not resolve hostname"

**Проблема:** Неправильный IP адрес или проблемы с сетью.

**Решение:**
1. Проверьте IP адрес в панели VK Cloud
2. Попробуйте пинг:
   ```powershell
   ping 87.239.108.115
   ```
   (замените на ваш IP)

## ✅ После успешного подключения

Теперь вы можете установить PostgreSQL:

```bash
# Обновите систему
sudo apt update

# Установите PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Создайте базу данных
sudo -u postgres psql -c "CREATE DATABASE tashi_ani_prod;"

# Создайте пользователя (замените ПАРОЛЬ на свой!)
sudo -u postgres psql -c "CREATE USER tashi_ani_user WITH PASSWORD 'ВАШ_СИЛЬНЫЙ_ПАРОЛЬ';"

# Дайте права
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tashi_ani_prod TO tashi_ani_user;"
```

## 🆘 Если всё ещё не работает

1. Проверьте что ключ существует:
   ```powershell
   Test-Path C:\Users\DGer\.ssh\tashi-ani.pem
   ```

2. Проверьте права на ключ:
   ```powershell
   icacls C:\Users\DGer\.ssh\tashi-ani.pem
   ```

3. Попробуйте создать новый ключ:
   ```powershell
   ssh-keygen -t ed25519 -C "tashi-ani" -f C:\Users\DGer\.ssh\tashi-ani-new
   ```
   Затем добавьте `tashi-ani-new.pub` в VK Cloud и используйте `tashi-ani-new` для подключения.

4. Проверьте что сервер запущен и доступен в панели VK Cloud.

