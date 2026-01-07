#!/bin/bash

# Скрипт для обновления проекта из GitHub
# Использование: ./update-from-github.sh

set -e  # Остановить при ошибке

echo "🔄 Начинаем обновление из GitHub..."
echo ""

# Переходим в директорию проекта
PROJECT_DIR="/var/www/tashi-ani"
cd "$PROJECT_DIR"

# Сохраняем текущую ветку
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "master")
echo "📋 Текущая ветка: $CURRENT_BRANCH"

# Получаем последние изменения
echo "⬇️  Получаем изменения из GitHub..."
git fetch origin

# Переключаемся на нужную ветку (обычно master или main)
BRANCH="master"
if git show-ref --verify --quiet refs/heads/main; then
    BRANCH="main"
fi

echo "🔄 Переключаемся на ветку: $BRANCH"
git checkout $BRANCH

# Обновляем код
echo "🔄 Обновляем код..."
git pull origin $BRANCH

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Генерируем Prisma клиент
echo "🗄️  Генерируем Prisma клиент..."
npx prisma generate

# Применяем миграции базы данных
echo "🗄️  Применяем миграции..."
if npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Миграции применены"
else
    echo "⚠️  Миграции не применены, пробуем db push..."
    npx prisma db push || true
fi

# Собираем проект
echo "🔨 Собираем проект..."
npm run build

# Перезапускаем приложение через PM2
echo "🔄 Перезапускаем приложение..."
pm2 restart tashi-ani || pm2 start ecosystem.config.js

echo ""
echo "✅ Обновление завершено успешно!"
echo ""
echo "📊 Статус приложения:"
pm2 status

echo ""
echo "📋 Последние логи:"
pm2 logs tashi-ani --lines 20 --nostream




