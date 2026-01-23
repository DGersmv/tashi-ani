#!/bin/bash
# Скрипт восстановления базы данных из S3 (Reg.ru)
# Проект: tashi-ani

set -e

# === НАСТРОЙКИ ===
PROJECT_NAME="tashi-ani"
DB_PATH="/var/www/tashi-ani/prisma/prod.db"
LOCAL_BACKUP_DIR="/var/backups/tashi-ani"

# S3 настройки (Reg.ru)
S3_ENDPOINT="https://s3.regru.cloud"
S3_BUCKET="tashi-ani-base"
S3_PREFIX="${PROJECT_NAME}/"

# Загружаем переменные окружения для S3 ключей
if [ -f "/var/www/tashi-ani/.env.local" ]; then
    export $(grep -E '^(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)' /var/www/tashi-ani/.env.local | xargs)
fi

# === ФУНКЦИИ ===
list_backups() {
    echo "=== Доступные бэкапы в S3 ==="
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}" \
        --endpoint-url "${S3_ENDPOINT}" \
        --region ru-1 \
        --no-verify-ssl | sort -r | head -20
    echo ""
    echo "Для восстановления укажите имя файла:"
    echo "  $0 db-20251219_120000.sqlite"
}

restore_backup() {
    BACKUP_NAME=$1
    
    echo "=== Восстановление базы данных ==="
    echo "Файл: ${BACKUP_NAME}"
    echo ""
    
    # Скачиваем бэкап
    TEMP_FILE="/tmp/${BACKUP_NAME}"
    echo "Скачиваю из S3..."
    aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}${BACKUP_NAME}" "${TEMP_FILE}" \
        --endpoint-url "${S3_ENDPOINT}" \
        --region ru-1 \
        --no-verify-ssl
    
    if [ ! -f "${TEMP_FILE}" ]; then
        echo "ОШИБКА: Не удалось скачать бэкап!"
        exit 1
    fi
    
    # Проверяем целостность
    echo "Проверяю целостность базы..."
    sqlite3 "${TEMP_FILE}" "PRAGMA integrity_check;" > /dev/null
    
    # Создаем резервную копию текущей БД
    if [ -f "${DB_PATH}" ]; then
        CURRENT_BACKUP="${DB_PATH}.before-restore.$(date +%Y%m%d_%H%M%S)"
        echo "Создаю резервную копию текущей БД: ${CURRENT_BACKUP}"
        cp "${DB_PATH}" "${CURRENT_BACKUP}"
    fi
    
    # Останавливаем приложение
    echo "Останавливаю приложение..."
    pm2 stop tashi-ani 2>/dev/null || true
    
    # Восстанавливаем
    echo "Восстанавливаю базу данных..."
    cp "${TEMP_FILE}" "${DB_PATH}"
    
    # Запускаем приложение
    echo "Запускаю приложение..."
    pm2 start tashi-ani 2>/dev/null || true
    
    # Очистка
    rm -f "${TEMP_FILE}"
    
    echo ""
    echo "=== Восстановление завершено ==="
    echo "База данных восстановлена из: ${BACKUP_NAME}"
}

# === MAIN ===
if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
    echo "ОШИБКА: S3 ключи не настроены!"
    echo "Добавьте в .env.local:"
    echo "  AWS_ACCESS_KEY_ID=ваш_access_key"
    echo "  AWS_SECRET_ACCESS_KEY=ваш_secret_key"
    exit 1
fi

if [ -z "$1" ]; then
    list_backups
else
    read -p "Вы уверены, что хотите восстановить базу из $1? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        restore_backup "$1"
    else
        echo "Отменено."
    fi
fi
