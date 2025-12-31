# 🔓 Временное отключение входа по SSH ключу

## Проблема
Не можете скопировать/вставить в веб-консоли, нужно временно разрешить вход по паролю.

## ✅ Решение: Отключить вход по ключу временно

### Шаг 1: В веб-консоли выполните эти команды

```bash
# Переименуйте файл authorized_keys (это отключит вход по ключу)
mv ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup
```

Или если файла нет, создайте директорию:
```bash
mkdir -p ~/.ssh
```

### Шаг 2: Настройте SSH сервер для приема паролей

```bash
# Откройте конфигурацию SSH
nano /etc/ssh/sshd_config
```

**Найдите эти строки и измените:**
```
#PasswordAuthentication yes
#PubkeyAuthentication yes
```

**Измените на:**
```
PasswordAuthentication yes
PubkeyAuthentication no
```

**Сохраните:** Ctrl+X, затем Y, затем Enter

### Шаг 3: Перезапустите SSH сервер

```bash
# Перезапустите SSH сервис
systemctl restart sshd
# или
service ssh restart
```

### Шаг 4: Установите новый пароль для root

```bash
# Установите новый пароль
passwd root
```

Введите новый пароль дважды (запомните его!).

## ✅ Теперь можно подключиться по паролю

С вашего компьютера:
```powershell
ssh root@89.104.67.209
```

Введите пароль, который вы установили.

## 🔄 Когда захотите вернуть вход по ключу

```bash
# Верните файл authorized_keys
mv ~/.ssh/authorized_keys.backup ~/.ssh/authorized_keys

# Верните настройки SSH
nano /etc/ssh/sshd_config
# Измените обратно:
# PubkeyAuthentication yes
# PasswordAuthentication no

# Перезапустите SSH
systemctl restart sshd
```

## ⚠️ Важно

После отключения ключей убедитесь, что:
1. Установили надежный пароль для root
2. Можете подключиться по паролю
3. Проблема с "нет сети" решена

## 🚀 Быстрые команды для веб-консоли

Скопируйте и выполните по одной:

```bash
mv ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup 2>/dev/null || echo "File not found, creating directory" && mkdir -p ~/.ssh
```

```bash
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config && sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
```

```bash
sed -i 's/PubkeyAuthentication yes/PubkeyAuthentication no/' /etc/ssh/sshd_config
```

```bash
systemctl restart sshd
```

```bash
passwd root
```

