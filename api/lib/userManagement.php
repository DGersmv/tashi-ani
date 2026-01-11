<?php
/**
 * Функции для управления пользователями
 * Аналог lib/userManagement.ts для PHP
 */

require_once __DIR__ . '/../db.php';

function isMasterAdmin($email) {
    $masterEmail = defined('MASTER_ADMIN_EMAIL') ? MASTER_ADMIN_EMAIL : '';
    return strtolower($email) === strtolower($masterEmail);
}

function userExists($email) {
    try {
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->execute(['email' => strtolower($email)]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        error_log("Error checking user existence: " . $e->getMessage());
        return false;
    }
}

function verifyToken($token) {
    $secret = defined('JWT_SECRET') ? JWT_SECRET : 'fallback-secret';
    
    try {
        // Простая проверка токена (можно использовать библиотеку firebase/php-jwt)
        // Пока простая реализация
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        $header = $parts[0];
        $payload = $parts[1];
        $signature = $parts[2];
        
        // Проверка подписи
        $validSignature = hash_hmac('sha256', $header . "." . $payload, $secret, true);
        $base64UrlValidSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));
        
        if (!hash_equals($base64UrlValidSignature, $signature)) {
            return null;
        }
        
        // Декодируем payload
        $decodedPayload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        
        if (!$decodedPayload || !isset($decodedPayload['userId']) || !isset($decodedPayload['exp'])) {
            return null;
        }
        
        // Проверка срока действия
        if ($decodedPayload['exp'] < time()) {
            return null;
        }
        
        return $decodedPayload;
    } catch (Exception $e) {
        error_log("Error verifying token: " . $e->getMessage());
        return null;
    }
}

// Алиас для совместимости
function verifyJwtToken($token) {
    return verifyToken($token);
}

function generateToken($userId, $email, $role = 'USER') {
    $secret = defined('JWT_SECRET') ? JWT_SECRET : 'fallback-secret';
    
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'userId' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + (7 * 24 * 60 * 60) // 7 дней
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

// Алиас для совместимости
function generateJwtToken($userId, $email, $role = 'USER') {
    return generateToken($userId, $email, $role);
}

function verifyPassword($email, $password) {
    try {
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id, password, role FROM users WHERE email = :email AND status = 'ACTIVE'");
        $stmt->execute(['email' => strtolower($email)]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return null;
        }
        
        // Проверяем пароль (bcrypt)
        if (password_verify($password, $user['password'])) {
            return [
                'id' => $user['id'],
                'email' => $email,
                'role' => $user['role']
            ];
        }
        
        // Если пароль не bcrypt, проверяем как обычную строку (для совместимости)
        if ($user['password'] === $password) {
            return [
                'id' => $user['id'],
                'email' => $email,
                'role' => $user['role']
            ];
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Error verifying password: " . $e->getMessage());
        return null;
    }
}

function updateLastLogin($userId) {
    try {
        $db = getDbConnection();
        $stmt = $db->prepare("UPDATE users SET lastLogin = NOW() WHERE id = :id");
        $stmt->execute(['id' => $userId]);
    } catch (Exception $e) {
        error_log("Error updating last login: " . $e->getMessage());
    }
}

?>
