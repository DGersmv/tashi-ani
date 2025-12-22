#!/bin/bash
# Безопасное обновление сервера с сохранением данных

set -e  # Остановка при ошибке

echo "🔍 Проверка текущего состояния..."
echo ""

# 1. Проверяем текущую БД
echo "=== Проверка базы данных ==="
if [ -f "/var/lib/tashi-ani/db/tashi-ani.db" ]; then
    DB_SIZE=$(du -h /var/lib/tashi-ani/db/tashi-ani.db | cut -f1)
    echo "✅ БД найдена: /var/lib/tashi-ani/db/tashi-ani.db ($DB_SIZE)"
else
    echo "❌ БД не найдена!"
    exit 1
fi

# 2. Проверяем .env
echo ""
echo "=== Проверка .env ==="
if [ -f ".env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)
    echo "DATABASE_URL: $DATABASE_URL"
else
    echo "❌ Файл .env не найден!"
    exit 1
fi

# 3. Создаем бэкап текущего состояния
echo ""
echo "=== Создание бэкапа ==="
BACKUP_DIR="/var/backups/tashi-ani/pre-update-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Бэкап БД
cp /var/lib/tashi-ani/db/tashi-ani.db "$BACKUP_DIR/tashi-ani.db"
echo "✅ БД скопирована в $BACKUP_DIR"

# Бэкап .env
cp .env "$BACKUP_DIR/.env"
echo "✅ .env скопирован"

# Бэкап текущих изменений (если есть)
if [ -n "$(git status --porcelain)" ]; then
    git stash push -m "Backup before update $(date +%Y%m%d_%H%M%S)"
    echo "✅ Локальные изменения сохранены в stash"
fi

# 4. Обновляем код
echo ""
echo "=== Обновление кода из GitHub ==="
git fetch origin
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "ℹ️  Код уже актуален"
else
    echo "Обновление с $CURRENT_COMMIT на $REMOTE_COMMIT"
    git pull origin $CURRENT_BRANCH
    echo "✅ Код обновлен"
fi

# 5. Устанавливаем зависимости
echo ""
echo "=== Установка зависимостей ==="
npm install
echo "✅ Зависимости установлены"

# 6. Применяем миграции
echo ""
echo "=== Применение миграций ==="
npx prisma migrate deploy
echo "✅ Миграции применены"

# 7. Пересобираем приложение
echo ""
echo "=== Сборка приложения ==="
npm run build
echo "✅ Приложение собрано"

# 8. Перезапускаем приложение
echo ""
echo "=== Перезапуск приложения ==="
pm2 restart tashi-ani
echo "✅ Приложение перезапущено"

# 9. Проверяем статус
echo ""
echo "=== Проверка статуса ==="
sleep 2
pm2 status
pm2 logs tashi-ani --lines 10 --nostream

echo ""
echo "✅ Обновление завершено!"
echo "📦 Бэкап сохранен в: $BACKUP_DIR"

