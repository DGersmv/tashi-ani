# 🔒 Настройка SSL для tashi-ani.ru

## Шаг 1: Проверка текущей конфигурации

```bash
# Проверьте текущую конфигурацию nginx
sudo cat /etc/nginx/sites-available/tashi-ani

# Проверьте есть ли SSL блок
sudo grep -A 10 "listen.*443" /etc/nginx/sites-available/tashi-ani
```

## Шаг 2: Установка Certbot (если не установлен)

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

## Шаг 3: Получение SSL сертификата

```bash
# Автоматическая настройка SSL через certbot
sudo certbot --nginx -d tashi-ani.ru -d www.tashi-ani.ru

# Следуйте инструкциям:
# - Введите email для уведомлений
# - Согласитесь с условиями (A)
# - Выберите redirect HTTP на HTTPS (2)
```

## Шаг 4: Проверка конфигурации

```bash
# Проверьте что конфигурация правильная
sudo nginx -t

# Перезагрузите nginx
sudo systemctl reload nginx

# Проверьте что порт 443 слушает
sudo netstat -tulpn | grep :443
```

## Шаг 5: Проверка работы

```bash
# Проверьте HTTPS
curl -I https://tashi-ani.ru

# Проверьте что HTTP редиректит на HTTPS
curl -I http://tashi-ani.ru
# Должен быть редирект 301 на HTTPS
```

## Шаг 6: Автообновление сертификата

Certbot автоматически настраивает автообновление через cron. Проверьте:

```bash
# Проверьте что автообновление настроено
sudo certbot renew --dry-run
```

## Альтернативный способ (если certbot не работает)

Если certbot не работает, можно настроить SSL вручную:

```bash
# Создайте бэкап текущей конфигурации
sudo cp /etc/nginx/sites-available/tashi-ani /etc/nginx/sites-available/tashi-ani.backup

# Отредактируйте конфигурацию
sudo nano /etc/nginx/sites-available/tashi-ani
```

Добавьте SSL блок:

```nginx
server {
    listen 443 ssl http2;
    server_name tashi-ani.ru www.tashi-ani.ru;

    ssl_certificate /etc/letsencrypt/live/tashi-ani.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tashi-ani.ru/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}

# Редирект HTTP на HTTPS
server {
    listen 80;
    server_name tashi-ani.ru www.tashi-ani.ru;
    return 301 https://$server_name$request_uri;
}
```

## Проверка после настройки

1. Откройте `https://tashi-ani.ru` в браузере
2. Проверьте что есть зеленый замочек (SSL работает)
3. Проверьте что HTTP редиректит на HTTPS

## Проблемы и решения

### Проблема: Certbot не может получить сертификат
**Решение:** Убедитесь что:
- Домен указывает на IP сервера
- Порт 80 открыт в firewall
- Nginx работает

### Проблема: Сертификат не обновляется автоматически
**Решение:** Проверьте cron:
```bash
sudo crontab -l | grep certbot
```

### Проблема: 502 Bad Gateway после настройки SSL
**Решение:** Проверьте что Next.js работает:
```bash
pm2 status
curl http://127.0.0.1:3000
```

