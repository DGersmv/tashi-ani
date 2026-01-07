#!/bin/bash

# Скрипт для мониторинга и автоматического перезапуска приложения
# Добавьте в cron: */5 * * * * /var/www/tashi-ani/scripts/monitor-app.sh

APP_NAME="tashi-ani"
APP_URL="http://localhost:3000"
LOG_FILE="/var/www/tashi-ani/logs/monitor.log"

# Создаем директорию для логов если её нет
mkdir -p /var/www/tashi-ani/logs

# Функция для логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Проверяем статус PM2
PM2_STATUS=$(pm2 jlist | grep -o "\"name\":\"$APP_NAME\"" | wc -l)

if [ "$PM2_STATUS" -eq 0 ]; then
    log "⚠️  Приложение не запущено в PM2, запускаем..."
    cd /var/www/tashi-ani
    pm2 start ecosystem.config.js
    pm2 save
    log "✅ Приложение запущено"
    exit 0
fi

# Проверяем статус процесса
PM2_INFO=$(pm2 jlist | grep -A 20 "\"name\":\"$APP_NAME\"")
STATUS=$(echo "$PM2_INFO" | grep -o "\"pm2_env\":{[^}]*\"status\":\"[^\"]*\"" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4)

# Проверяем статус более надежно
if [ -z "$STATUS" ] || [ "$STATUS" != "online" ]; then
    if [ -n "$STATUS" ] && [ "$STATUS" != "online" ]; then
        log "⚠️  Приложение в статусе: $STATUS, перезапускаем..."
        pm2 restart "$APP_NAME"
        log "✅ Приложение перезапущено"
        exit 0
    fi
fi

# Проверяем доступность приложения
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$APP_URL" 2>/dev/null)

# Перезапускаем только если код ответа не 200 и не пустой (ошибка подключения)
if [ -n "$HTTP_CODE" ] && [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "000" ]; then
    log "⚠️  Приложение не отвечает (HTTP $HTTP_CODE), перезапускаем..."
    pm2 restart "$APP_NAME"
    log "✅ Приложение перезапущено после проверки доступности"
    exit 0
fi

# Если curl вернул 000 (не может подключиться), это тоже проблема
if [ "$HTTP_CODE" = "000" ]; then
    log "⚠️  Не удается подключиться к приложению (HTTP $HTTP_CODE), перезапускаем..."
    pm2 restart "$APP_NAME"
    log "✅ Приложение перезапущено после ошибки подключения"
    exit 0
fi

# Проверяем использование памяти
MEMORY_USAGE=$(pm2 jlist | grep -A 20 "\"name\":\"$APP_NAME\"" | grep -o "\"memory\":[0-9]*" | cut -d':' -f2)
MEMORY_MB=$((MEMORY_USAGE / 1024 / 1024))

# Если память больше 800MB, перезапускаем
if [ "$MEMORY_MB" -gt 800 ]; then
    log "⚠️  Высокое использование памяти: ${MEMORY_MB}MB, перезапускаем..."
    pm2 restart "$APP_NAME"
    log "✅ Приложение перезапущено из-за использования памяти"
    exit 0
fi

# Если всё ок, логируем только раз в час (чтобы не засорять логи)
LAST_LOG_TIME=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -o "✅ Приложение работает нормально" > /dev/null && echo "logged" || echo "not_logged")
CURRENT_HOUR=$(date +%H)
LAST_LOG_HOUR=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -o "✅ Приложение работает нормально" > /dev/null && tail -1 "$LOG_FILE" | cut -d' ' -f2 | cut -d':' -f1 || echo "")

if [ "$HTTP_CODE" = "200" ]; then
    # Логируем только если прошло больше часа с последнего лога или это первый запуск
    if [ "$LAST_LOG_HOUR" != "$CURRENT_HOUR" ] || [ -z "$LAST_LOG_HOUR" ]; then
        log "✅ Приложение работает нормально (HTTP $HTTP_CODE, память: ${MEMORY_MB}MB)"
    fi
fi

