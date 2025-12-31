# 🔑 Подключение к серверу с любого компьютера

## Проблема
Вы установили SSH ключ на рабочем компьютере, но теперь нужно подключиться с другого места.

## ✅ Решения

### Вариант 1: Подключение по паролю (самый простой)

**Данные для подключения:**
- **IP:** `89.104.67.209`
- **Пользователь:** `root`
- **Пароль:** `RzOFp5upP4a6MyDi`

#### Windows (PowerShell или CMD):
```powershell
ssh root@89.104.67.209
# Введите пароль: RzOFp5upP4a6MyDi
```

#### Linux/Mac:
```bash
ssh root@89.104.67.209
# Введите пароль: RzOFp5upP4a6MyDi
```

**Если SSH требует только ключ и не принимает пароль**, используйте:

```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no root@89.104.67.209
```

### Вариант 2: Автоматическое подключение с паролем (Linux/Mac)

Если у вас установлен `sshpass`:

```bash
sshpass -p "RzOFp5upP4a6MyDi" ssh root@89.104.67.209
```

Установка `sshpass`:
- **Ubuntu/Debian:** `sudo apt-get install sshpass`
- **Mac:** `brew install hudochenkov/sshpass/sshpass`

### Вариант 3: Настроить SSH ключ на текущем компьютере

#### Шаг 1: Создайте SSH ключ (если его нет)
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# Нажмите Enter для всех вопросов (или укажите путь)
```

#### Шаг 2: Скопируйте публичный ключ на сервер

**Сначала подключитесь по паролю:**
```bash
ssh root@89.104.67.209
# Введите пароль: RzOFp5upP4a6MyDi
```

**На сервере добавьте ваш публичный ключ:**
```bash
# Создайте директорию .ssh если её нет
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Откройте файл authorized_keys
nano ~/.ssh/authorized_keys
```

**На вашем компьютере скопируйте публичный ключ:**
```bash
# Windows (PowerShell)
cat $env:USERPROFILE\.ssh\id_rsa.pub

# Linux/Mac
cat ~/.ssh/id_rsa.pub
```

**Вставьте содержимое ключа в файл `authorized_keys` на сервере, сохраните (Ctrl+X, Y, Enter)**

**Установите правильные права:**
```bash
chmod 600 ~/.ssh/authorized_keys
exit
```

**Теперь вы можете подключаться без пароля:**
```bash
ssh root@89.104.67.209
```

### Вариант 4: Использовать SSH config файл

Создайте файл `~/.ssh/config` (или `C:\Users\YourName\.ssh\config` на Windows):

```
Host tashi-ani
    HostName 89.104.67.209
    User root
    PreferredAuthentications password
    PubkeyAuthentication no
```

Теперь можно подключаться просто:
```bash
ssh tashi-ani
```

## 🚀 Быстрые команды после подключения

После успешного подключения к серверу:

```bash
# Перейти в директорию проекта
cd /var/www/tashi-ani

# Проверить статус приложения
pm2 status

# Посмотреть логи
pm2 logs tashi-ani --lines 50

# Перезапустить приложение
pm2 restart tashi-ani
```

## 🔧 Если не получается подключиться

### Проблема: "Permission denied (publickey)"

**Решение:** Используйте принудительное подключение по паролю:
```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no root@89.104.67.209
```

### Проблема: "Connection refused"

**Решение:** 
1. Проверьте, что сервер доступен: `ping 89.104.67.209`
2. Проверьте, что SSH сервис запущен на сервере (нужен доступ к серверу через другой способ)

### Проблема: "Host key verification failed"

**Решение:** Удалите старый ключ:
```bash
ssh-keygen -R 89.104.67.209
```

## 📝 Полезные команды для работы с сервером

```bash
# Проверить статус PM2
pm2 status

# Перезапустить приложение
pm2 restart tashi-ani

# Посмотреть логи
pm2 logs tashi-ani

# Проверить переменные окружения
pm2 env 0

# Проверить файл .env.local
cat /var/www/tashi-ani/.env.local

# Редактировать .env.local
nano /var/www/tashi-ani/.env.local
```

## 🔐 Безопасность

⚠️ **Важно:** Пароль хранится в открытом виде в документации. Рекомендуется:
1. Настроить SSH ключи для безопасного доступа
2. Отключить вход по паролю после настройки ключей
3. Использовать сложные пароли

## ✅ Чеклист подключения

- [ ] Подключился к серверу
- [ ] Перешел в `/var/www/tashi-ani`
- [ ] Проверил статус PM2 (`pm2 status`)
- [ ] Проверил логи (`pm2 logs tashi-ani`)
- [ ] При необходимости перезапустил приложение (`pm2 restart tashi-ani`)

