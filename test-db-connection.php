<?php
/**
 * Тестовый скрипт для проверки подключения к MySQL
 * Использование: php test-db-connection.php
 */

require_once __DIR__ . '/api/db.php';

echo "🔍 Проверка подключения к MySQL...\n\n";

try {
    $db = getDbConnection();
    echo "✅ Подключение к MySQL успешно!\n\n";
    
    // Проверяем версию MySQL
    $stmt = $db->query("SELECT VERSION() as version");
    $version = $stmt->fetch();
    echo "📊 Версия MySQL: " . $version['version'] . "\n";
    
    // Проверяем список таблиц
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "⚠️  Таблицы не найдены. Нужно создать схему БД.\n";
    } else {
        echo "📋 Найдено таблиц: " . count($tables) . "\n";
        echo "   Таблицы: " . implode(', ', $tables) . "\n";
    }
    
    echo "\n✅ Все проверки пройдены!\n";
    
} catch (Exception $e) {
    echo "❌ Ошибка подключения: " . $e->getMessage() . "\n";
    echo "\nПроверьте:\n";
    echo "  1. Данные в config.php правильные?\n";
    echo "  2. База данных создана на reg.ru?\n";
    echo "  3. Пользователь имеет права доступа?\n";
    exit(1);
}

?>
