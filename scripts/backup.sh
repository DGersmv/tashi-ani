#!/bin/bash

# Скрипт для создания бэкапа проекта
# Использование: ./backup.sh

BACKUP_DIR="/var/backups/tashi-ani"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/tashi-ani"

# Создаем директорию для бэкапов
mkdir -p $BACKUP_DIR

echo "📦 Создание бэкапа: $DATE"
echo ""

# Бэкап базы данных
if [ -f "$PROJECT_DIR/prisma/prod.db" ]; then
    echo "🗄️  Бэкап базы данных..."
    cp "$PROJECT_DIR/prisma/prod.db" "$BACKUP_DIR/db_$DATE.db"
    echo "   ✅ База данных сохранена: db_$DATE.db"
else
    echo "⚠️  База данных не найдена"
fi

# Бэкап загруженных файлов
if [ -d "$PROJECT_DIR/public/uploads" ] && [ "$(ls -A $PROJECT_DIR/public/uploads)" ]; then
    echo "📁 Бэкап загруженных файлов..."
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR" public/uploads 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ Файлы сохранены: uploads_$DATE.tar.gz"
    else
        echo "   ⚠️  Ошибка при создании архива файлов"
    fi
else
    echo "⚠️  Директория загрузок пуста или не существует"
fi

# Бэкап .env.local (важно!)
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo "⚙️  Бэкап конфигурации..."
    cp "$PROJECT_DIR/.env.local" "$BACKUP_DIR/env_$DATE.local"
    echo "   ✅ Конфигурация сохранена: env_$DATE.local"
else
    echo "⚠️  Файл .env.local не найден"
fi

# Удаляем старые бэкапы (старше 30 дней)
echo ""
echo "🧹 Удаление старых бэкапов (старше 30 дней)..."
OLD_BACKUPS=$(find $BACKUP_DIR -type f -mtime +30 2>/dev/null | wc -l)
if [ $OLD_BACKUPS -gt 0 ]; then
    find $BACKUP_DIR -type f -mtime +30 -delete
    echo "   ✅ Удалено старых бэкапов: $OLD_BACKUPS"
else
    echo "   ℹ️  Старых бэкапов не найдено"
fi

echo ""
echo "✅ Бэкап завершен: $DATE"
echo ""
echo "📊 Размер бэкапов:"
du -sh $BACKUP_DIR
echo ""
echo "📋 Список последних бэкапов:"
ls -lh $BACKUP_DIR | tail -5




