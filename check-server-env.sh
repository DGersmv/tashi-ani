#!/bin/bash

# Скрипт для проверки переменных окружения на сервере

echo "🔍 Проверка переменных окружения на сервере..."
echo ""

# Проверка наличия .env.local
if [ ! -f .env.local ]; then
    echo "❌ Файл .env.local не найден!"
    echo "Создайте его командой: nano .env.local"
    exit 1
else
    echo "✅ Файл .env.local существует"
fi

# Проверка обязательных переменных
echo ""
echo "📋 Проверка обязательных переменных:"

REQUIRED_VARS=("JWT_SECRET" "DATABASE_URL" "MASTER_ADMIN_EMAIL" "MASTER_ADMIN_PASSWORD")

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env.local; then
        echo "✅ $var установлен"
    else
        echo "❌ $var НЕ установлен!"
    fi
done

# Проверка базы данных
echo ""
echo "🗄️  Проверка базы данных:"

DB_PATH=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2 | tr -d '"' | sed 's/file://')

if [[ "$DB_PATH" == *".db"* ]]; then
    # SQLite
    DB_FILE=$(echo "$DB_PATH" | sed 's|^\./||')
    if [ -f "$DB_FILE" ]; then
        echo "✅ База данных существует: $DB_FILE"
        echo "   Размер: $(du -h "$DB_FILE" | cut -f1)"
    else
        echo "❌ База данных не найдена: $DB_FILE"
        echo "   Создайте её командой: npx prisma migrate deploy"
    fi
else
    echo "ℹ️  Используется PostgreSQL или другая БД"
fi

# Проверка PM2
echo ""
echo "⚙️  Проверка PM2:"

if command -v pm2 &> /dev/null; then
    echo "✅ PM2 установлен"
    
    if pm2 list | grep -q "tashi-ani"; then
        echo "✅ Приложение tashi-ani запущено"
        STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="tashi-ani") | .pm2_env.status')
        echo "   Статус: $STATUS"
    else
        echo "❌ Приложение tashi-ani не запущено"
        echo "   Запустите: pm2 start ecosystem.config.js"
    fi
else
    echo "❌ PM2 не установлен"
fi

# Проверка Node.js
echo ""
echo "📦 Проверка Node.js:"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js установлен: $NODE_VERSION"
else
    echo "❌ Node.js не установлен"
fi

# Итоговые рекомендации
echo ""
echo "📝 Рекомендации:"
echo "1. Убедитесь, что JWT_SECRET установлен и одинаковый везде"
echo "2. Проверьте, что DATABASE_URL указывает на правильный путь"
echo "3. Перезапустите PM2 с обновлением переменных:"
echo "   pm2 restart tashi-ani --update-env"
echo "4. Проверьте логи:"
echo "   pm2 logs tashi-ani --lines 50"

