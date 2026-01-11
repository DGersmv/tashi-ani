<?php
/**
 * Подключение к базе данных (MySQL или PostgreSQL)
 * Аналог lib/prisma.ts для PHP
 */

// Отключаем вывод ошибок (чтобы не портить JSON в API)
if (!defined('DB_ERRORS_DISABLED')) {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    define('DB_ERRORS_DISABLED', true);
}

function getDbConnection() {
    static $db = null;
    
    if ($db === null) {
        $databaseUrl = getenv('DATABASE_URL') ?: $_ENV['DATABASE_URL'] ?? '';
        
        if (empty($databaseUrl)) {
            // Если переменная окружения не установлена, используем значения из config.php
            $configPath = __DIR__ . '/../config.php';
            if (file_exists($configPath)) {
                require_once $configPath;
                $databaseUrl = defined('DATABASE_URL') ? DATABASE_URL : '';
            }
        }
        
        if (empty($databaseUrl)) {
            throw new Exception('DATABASE_URL not configured');
        }
        
        // Парсим DATABASE_URL
        // Формат MySQL: mysql://user:password@host:port/database
        // Формат PostgreSQL: postgresql://user:password@host:port/database?sslmode=require
        
        $urlParts = parse_url($databaseUrl);
        $scheme = $urlParts['scheme'] ?? '';
        
        $host = $urlParts['host'] ?? 'localhost';
        $port = $urlParts['port'] ?? null;
        $dbname = ltrim($urlParts['path'] ?? '', '/');
        $user = $urlParts['user'] ?? '';
        $password = $urlParts['pass'] ?? '';
        
        // Определяем тип БД по схеме URL
        if ($scheme === 'mysql' || $scheme === 'mysqli') {
            // MySQL подключение
            $port = $port ?: 3306;
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
            
            try {
                $db = new PDO($dsn, $user, $password);
                $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                // Для MySQL можно использовать эмуляцию prepared statements
                $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
            } catch (PDOException $e) {
                throw new Exception('MySQL connection failed: ' . $e->getMessage());
            }
        } else {
            // PostgreSQL подключение (по умолчанию)
            $port = $port ?: 5432;
            
            // Парсим query параметры (например, sslmode)
            $query = [];
            if (isset($urlParts['query'])) {
                parse_str($urlParts['query'], $query);
            }
            $sslmode = $query['sslmode'] ?? 'require';
            
            // Формат DSN для PostgreSQL
            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
            if (!empty($sslmode)) {
                $dsn .= ";sslmode=$sslmode";
            }
            
            try {
                $db = new PDO($dsn, $user, $password);
                $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                // Для PostgreSQL используем именованные параметры
                $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            } catch (PDOException $e) {
                throw new Exception('PostgreSQL connection failed: ' . $e->getMessage());
            }
        }
    }
    
    return $db;
}

/**
 * Вспомогательные функции для работы с базой данных
 */

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    // Очищаем буфер вывода
    while (ob_get_level()) {
        ob_end_clean();
    }
    ob_start();
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    ob_end_flush();
    exit;
}

function errorResponse($message, $statusCode = 500) {
    jsonResponse([
        'success' => false,
        'message' => $message
    ], $statusCode);
}

function successResponse($data = null) {
    $response = ['success' => true];
    if ($data !== null) {
        if (is_array($data) && isset($data[0])) {
            // Если массив объектов - добавляем как есть
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
    }
    jsonResponse($response, 200);
}

/**
 * Конвертация булевого значения из БД в PHP boolean
 * Поддерживает PostgreSQL ('t'/'f') и MySQL (1/0)
 */
function dbBool($value) {
    if ($value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true') {
        return true;
    }
    return false;
}

/**
 * Конвертация PHP boolean в значение для БД
 * Для MySQL возвращает 1/0, для PostgreSQL 'true'/'false'
 */
function toDbBool($value, $isMysql = true) {
    $bool = (bool)$value;
    if ($isMysql) {
        return $bool ? 1 : 0;
    } else {
        return $bool ? 'true' : 'false';
    }
}
