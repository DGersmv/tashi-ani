# 🔒 Обновление SSL сертификата через SSH на reg.ru

## 📋 Проверка текущего статуса

### 1. Проверить текущий сертификат

```bash
# Проверить срок действия сертификата
echo | openssl s_client -servername tashi-ani.ru -connect tashi-ani.ru:443 2>/dev/null | openssl x509 -noout -dates

# Или проверить через curl
curl -vI https://tashi-ani.ru 2>&1 | grep -i "expire\|certificate"
```

### 2. Проверить, установлен ли certbot

```bash
which certbot
certbot --version
```

## 🔧 Вариант 1: Через панель reg.ru (рекомендуется)

1. Войдите в панель управления reg.ru
2. Перейдите: **Мои домены** → **tashi-ani.ru** → **SSL-сертификаты**
3. Если используется Let's Encrypt - он обновляется автоматически
4. Если нужно обновить вручную - нажмите **"Обновить"** или **"Renew"**

## 🔧 Вариант 2: Через SSH (если certbot установлен)

### Проверка установки certbot

```bash
# Проверить наличие certbot
which certbot

# Если нет - проверить, можно ли установить
sudo yum list available | grep certbot
# или
sudo apt list --installed | grep certbot
```

### Обновление сертификата (если certbot установлен)

```bash
# Обновить все сертификаты
sudo certbot renew

# Или обновить конкретный домен
sudo certbot renew --cert-name tashi-ani.ru

# С тестовым режимом (без реального обновления)
sudo certbot renew --dry-run
```

### Перезагрузка веб-сервера после обновления

```bash
# Если Apache
sudo systemctl reload httpd
# или
sudo service httpd reload

# Если Nginx
sudo systemctl reload nginx
# или
sudo service nginx reload
```

## 🔧 Вариант 3: Через reg.ru CLI (если доступен)

```bash
# Проверить доступные команды reg.ru
reg.ru --help

# Обновить SSL (если есть такая команда)
reg.ru ssl renew tashi-ani.ru
```

## 📝 Проверка после обновления

### 1. Проверить новый срок действия

```bash
echo | openssl s_client -servername tashi-ani.ru -connect tashi-ani.ru:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. Проверить в браузере

Откройте `https://tashi-ani.ru` и проверьте:
- Замочек в адресной строке
- Нажмите на замочек → **"Сведения о сертификате"**
- Проверьте срок действия

## ⚠️ Важно

1. **На reg.ru хостинге обычно SSL обновляется автоматически**
2. **Если используете Let's Encrypt** - он обновляется сам каждые 90 дней
3. **Не нужно обновлять вручную**, если всё работает

## 🔍 Диагностика проблем

### Если сертификат истёк:

```bash
# Проверить дату истечения
echo | openssl s_client -servername tashi-ani.ru -connect tashi-ani.ru:443 2>/dev/null | openssl x509 -noout -enddate

# Проверить, какой сертификат используется
openssl s_client -connect tashi-ani.ru:443 -showcerts </dev/null 2>/dev/null | openssl x509 -noout -text | grep -A 2 "Issuer"
```

### Если нужно установить новый сертификат:

Обычно это делается через панель reg.ru, а не через SSH.

---

**Рекомендация:** Сначала проверьте через панель reg.ru - там проще и безопаснее обновлять SSL.
