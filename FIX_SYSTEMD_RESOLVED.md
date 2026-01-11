# 🔧 Исправление DNS через systemd-resolved

## ⚠️ Проблема

Файл `/etc/resolv.conf` управляется systemd-resolved и указывает на локальный DNS (127.0.0.53), который не работает.

## ✅ Решение: Настроить systemd-resolved

### Шаг 1: Отредактируйте конфигурацию systemd-resolved

```bash
sudo nano /etc/systemd/resolved.conf
```

**Найдите строки и раскомментируйте/измените:**

```
[Resolve]
DNS=8.8.8.8 8.8.4.4 1.1.1.1
FallbackDNS=1.1.1.1 8.8.8.8
```

**Должно выглядеть так:**

```
[Resolve]
DNS=8.8.8.8 8.8.4.4 1.1.1.1
FallbackDNS=1.1.1.1 8.8.8.8
#Domains=
#LLMNR=yes
#MulticastDNS=yes
#DNSSEC=yes
#DNSOverTLS=no
#Cache=yes
#DNSStubListener=yes
#ReadEtcHosts=yes
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 2: Перезапустите systemd-resolved

```bash
sudo systemctl restart systemd-resolved
```

### Шаг 3: Проверьте что DNS работает

```bash
# Проверьте статус
resolvectl status

# Проверьте разрешение имён
nslookup security.ubuntu.com
```

### Шаг 4: Попробуйте обновить снова

```bash
sudo apt update
```

## 🔄 Альтернатива: Статический resolv.conf (если не помогло)

Если systemd-resolved всё ещё не работает, можно создать статический файл:

```bash
# Создайте резервную копию
sudo mv /etc/resolv.conf /etc/resolv.conf.backup

# Создайте новый статический файл
sudo nano /etc/resolv.conf
```

**Вставьте:**

```
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Защитите файл от перезаписи:**

```bash
sudo chattr +i /etc/resolv.conf
```

**Проверьте:**

```bash
nslookup security.ubuntu.com
sudo apt update
```

## 🆘 Если нужно вернуть systemd-resolved

```bash
# Разблокируйте файл
sudo chattr -i /etc/resolv.conf

# Восстановите
sudo mv /etc/resolv.conf.backup /etc/resolv.conf

# Перезапустите
sudo systemctl restart systemd-resolved
```

