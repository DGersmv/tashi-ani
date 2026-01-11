<?php
/**
 * API endpoint для проверки кода верификации
 * POST /api/auth/verify-code.php
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/userManagement.php';

// Загружаем конфигурацию если есть
if (file_exists(__DIR__ . '/../../config.php')) {
    require_once __DIR__ . '/../../config.php';
}

// Поддержка OPTIONS для CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON', 400);
    }
    
    $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
    $code = isset($input['code']) ? trim($input['code']) : '';
    
    if (empty($email) || empty($code)) {
        errorResponse('Email и код обязательны', 400);
    }
    
    // Проверяем код в базе данных
    $db = getDbConnection();
    $stmt = $db->prepare("
        SELECT * FROM verification_codes 
        WHERE email = :email 
        AND code = :code 
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([
        'email' => $email,
        'code' => $code
    ]);
    
    $verificationCode = $stmt->fetch();
    
    if (!$verificationCode) {
        errorResponse('Неверный код или код истек', 401);
    }
    
    // Получаем пользователя
    $stmt = $db->prepare("SELECT id, email, name, role, status FROM users WHERE email = :email AND status = 'ACTIVE'");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Пользователь не найден', 404);
    }
    
    // Удаляем использованный код
    $stmt = $db->prepare("DELETE FROM verification_codes WHERE email = :email AND code = :code");
    $stmt->execute([
        'email' => $email,
        'code' => $code
    ]);
    
    // Обновляем время последнего входа
    $stmt = $db->prepare("UPDATE users SET \"lastLogin\" = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Генерируем токен
    $token = generateToken($user['id'], $user['email'], $user['role']);
    
    successResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'status' => $user['status']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Verify code error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
