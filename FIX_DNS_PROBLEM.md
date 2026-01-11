# 🔧 Решение проблемы с DNS (не может обновить пакеты)

## ❌ Проблема

```
Temporary failure resolving 'security.ubuntu.com'
```

Сервер не может разрешить DNS имена репозиториев Ubuntu.

## ✅ Решение

### Шаг 1: Проверьте доступность интернета

```bash
ping -c 3 8.8.8.8
```

Если пинг работает - интернет есть, проблема в DNS.

### Шаг 2: Измените DNS настройки

```bash
# Создайте резервную копию
sudo cp /etc/resolv.conf /etc/resolv.conf.backup

# Отредактируйте DNS настройки
sudo nano /etc/resolv.conf
```

**Замените содержимое на:**

```
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Проверьте что DNS работает

```bash
# Проверьте разрешение имён
nslookup security.ubuntu.com
```

Должно показать IP адрес.

### Шаг 4: Попробуйте обновить снова

```bash
sudo apt update
```

## 🔄 Альтернативное решение (если не помогло)

### Вариант 1: Использовать зеркала VK Cloud

```bash
# Отредактируйте sources.list
sudo nano /etc/apt/sources.list
```

**Замените на:**

```
deb http://mirror.vkcloud.ru/ubuntu/ jammy main restricted universe multiverse
deb http://mirror.vkcloud.ru/ubuntu/ jammy-updates main restricted universe multiverse
deb http://mirror.vkcloud.ru/ubuntu/ jammy-security main restricted universe multiverse
deb http://mirror.vkcloud.ru/ubuntu/ jammy-backports main restricted universe multiverse
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Обновите
sudo apt update
```

### Вариант 2: Исправить через systemd-resolved

```bash
# Остановите systemd-resolved
sudo systemctl stop systemd-resolved

# Отредактируйте resolv.conf
sudo nano /etc/resolv.conf
```

**Добавьте:**

```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

**Сохраните и попробуйте снова:**

```bash
sudo apt update
```

## 🆘 Если всё ещё не работает

### Проверьте сетевые настройки VK Cloud

1. Зайдите в панель VK Cloud
2. Проверьте настройки сети вашего сервера
3. Убедитесь что у сервера есть доступ к интернету

### Временное решение: Установка PostgreSQL без обновления

Если обновление не критично, можно попробовать установить PostgreSQL напрямую:

```bash
# Попробуйте установить без обновления
sudo apt install -y postgresql postgresql-contrib --allow-unauthenticated
```

**⚠️ Не рекомендуется, но может сработать если срочно нужно.**

## ✅ После исправления DNS

Когда `sudo apt update` заработает, продолжайте установку PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
```

