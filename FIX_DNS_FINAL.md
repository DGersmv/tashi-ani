# 🔧 Финальное решение проблемы DNS

## ⚠️ Проблема

DNS серверы VK Cloud (5.61.237.127, 5.61.237.120) не работают, а systemd-resolved использует их вместо глобальных настроек.

## ✅ Решение 1: Статический resolv.conf (быстрое)

```bash
# Создайте резервную копию
sudo mv /etc/resolv.conf /etc/resolv.conf.backup

# Создайте новый файл
sudo nano /etc/resolv.conf
```

**Вставьте:**

```
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Защитите от перезаписи:**

```bash
sudo chattr +i /etc/resolv.conf
```

**Проверьте:**

```bash
cat /etc/resolv.conf
nslookup security.ubuntu.com
sudo apt update
```

## ✅ Решение 2: Использовать зеркала VK Cloud (рекомендуется)

Если DNS не работает, используйте зеркала VK Cloud напрямую:

```bash
# Отредактируйте sources.list
sudo nano /etc/apt/sources.list
```

**Замените всё содержимое на:**

```
deb http://mirror.vkcloud.ru/ubuntu/ jammy main restricted universe multiverse
deb http://mirror.vkcloud.ru/ubuntu/ jammy-updates main restricted universe multiverse
deb http://mirror.vkcloud.ru/ubuntu/ jammy-security main restricted universe multiverse
deb http://mirror.vkcloud.ru/ubuntu/ jammy-backports main restricted universe multiverse
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Обновите:**

```bash
sudo apt update
```

## ✅ Решение 3: Настроить сетевой интерфейс

```bash
# Отредактируйте netplan конфигурацию
sudo nano /etc/netplan/50-cloud-init.yaml
```

**Найдите секцию с `ens3` и добавьте DNS:**

```yaml
network:
  version: 2
  ethernets:
    ens3:
      dhcp4: true
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
          - 1.1.1.1
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Примените:**

```bash
sudo netplan apply
sudo systemctl restart systemd-resolved
sudo apt update
```

## 🎯 Рекомендация

**Используйте Решение 2 (зеркала VK Cloud)** - это самое надёжное, так как не зависит от DNS.

