# 🔑 Добавление SSH ключа на сервер

## Ваш публичный ключ:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPC77C4XjX/odO8U6fQ8/8nu668HlCiF7sgmY1FJx+6h admin@227.info
```

## Добавление ключа на сервер (без символа ~)

### Шаг 1: Подключитесь к серверу через веб-консоль reg.ru

### Шаг 2: Выполните на сервере (ПОЛНЫЕ ПУТИ БЕЗ ~):

```bash
# Создайте директорию .ssh
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Добавьте ваш публичный ключ
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPC77C4XjX/odO8U6fQ8/8nu668HlCiF7sgmY1FJx+6h admin@227.info" >> /root/.ssh/authorized_keys

# Установите правильные права
chmod 600 /root/.ssh/authorized_keys

# Проверьте что ключ добавился
cat /root/.ssh/authorized_keys
```

### Шаг 3: Отключите пароли SSH (ВАЖНО!)

```bash
# Отредактируйте конфигурацию SSH
nano /etc/ssh/sshd_config

# Найдите и измените эти строки:
# PasswordAuthentication yes  →  PasswordAuthentication no
# PubkeyAuthentication yes  →  убедитесь что раскомментировано (без #)
# PermitRootLogin yes  →  PermitRootLogin prohibit-password

# Сохраните: Ctrl+O, Enter, Ctrl+X

# Проверьте конфигурацию
sshd -t

# Перезапустите SSH
systemctl restart sshd

# НЕ ЗАКРЫВАЙТЕ веб-консоль пока не проверите подключение!
```

### Шаг 4: Проверьте подключение с Windows

```powershell
# На Windows в PowerShell:
ssh -i C:\Users\DGer\.ssh\id_ed25519 -p 2222 root@89.104.67.209
```

Если подключение работает - пароли можно отключать.

Если не работает - проверьте что ключ правильно добавлен на сервере.

## Альтернатива: Скопируйте ключ вручную

Если не хотите использовать команды с `~`, просто:

1. Откройте файл `C:\Users\DGer\.ssh\id_ed25519.pub` в блокноте
2. Скопируйте содержимое (одну строку)
3. На сервере через веб-консоль:
   ```bash
   mkdir -p /root/.ssh
   nano /root/.ssh/authorized_keys
   # Вставьте ваш ключ (Ctrl+Shift+V)
   # Сохраните: Ctrl+O, Enter, Ctrl+X
   chmod 600 /root/.ssh/authorized_keys
   ```

