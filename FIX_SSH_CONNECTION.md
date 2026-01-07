# 🔧 Исправление проблемы SSH подключения

## Проблема
```
kex_exchange_identification: read: Connection reset
Connection reset by 89.104.67.209 port 22
```

## ✅ Решения

### Решение 1: Использовать веб-консоль reg.ru (РЕКОМЕНДУЕТСЯ)

1. Зайдите на https://www.reg.ru
2. Войдите в личный кабинет
3. Перейдите в раздел VPS → Ваш сервер
4. Откройте "Веб-консоль" или "VNC консоль"
5. Войдите как root

### Решение 2: Проверить fail2ban (через веб-консоль)

Если IP заблокирован fail2ban:

```bash
# Проверьте заблокированные IP
fail2ban-client status sshd

# Разблокируйте ваш IP (замените на ваш реальный IP)
fail2ban-client set sshd unbanip YOUR_IP_ADDRESS

# Или отключите fail2ban временно
systemctl stop fail2ban
```

### Решение 3: Проверить SSH сервис

```bash
# Проверьте статус SSH
systemctl status ssh

# Если не запущен, запустите
systemctl start ssh
systemctl enable ssh
```

### Решение 4: Проверить firewall

```bash
# Проверьте статус firewall
ufw status

# Если SSH закрыт, откройте его
ufw allow ssh
ufw allow 22/tcp
```

### Решение 5: Проверить конфигурацию SSH

```bash
# Проверьте конфигурацию SSH
cat /etc/ssh/sshd_config | grep -E "(Port|PermitRootLogin|PasswordAuthentication)"

# Перезапустите SSH если нужно
systemctl restart ssh
```

### Решение 6: Проверить логи SSH

```bash
# Посмотрите логи SSH на ошибки
tail -50 /var/log/auth.log
# или
journalctl -u ssh -n 50
```

## 🔍 Частые причины

1. **fail2ban заблокировал IP** - самая частая причина
2. **SSH сервис остановлен**
3. **Firewall блокирует порт 22**
4. **Сервер перезагружается**
5. **Проблемы с сетью reg.ru**

## ✅ Быстрое решение через веб-консоль

```bash
# 1. Проверьте fail2ban
fail2ban-client status sshd

# 2. Разблокируйте ваш IP (если заблокирован)
fail2ban-client set sshd unbanip YOUR_IP

# 3. Проверьте SSH
systemctl status ssh

# 4. Если SSH не работает, перезапустите
systemctl restart ssh

# 5. Проверьте firewall
ufw status
ufw allow ssh
```

## 🆘 Если ничего не помогает

1. Обратитесь в поддержку reg.ru
2. Попросите сбросить пароль root
3. Попросите предоставить веб-консоль доступ
4. Попросите проверить состояние сервера

