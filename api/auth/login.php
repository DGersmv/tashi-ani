<?php
/**
 * API endpoint для входа пользователя
 * POST /api/auth/login.php
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/userManagement.php';

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
    $password = isset($input['password']) ? $input['password'] : '';
    
    if (empty($email) || empty($password)) {
        errorResponse('Email и пароль обязательны', 400);
    }
    
    // Проверяем, является ли это мастер-админом
    if (isMasterAdmin($email)) {
        $masterPassword = defined('MASTER_ADMIN_PASSWORD') ? MASTER_ADMIN_PASSWORD : '';
        if ($password === $masterPassword) {
            // Генерируем токен для мастер-админа
            $token = generateToken(0, $email, 'MASTER');
            updateLastLogin(0);
            
            successResponse([
                'token' => $token,
                'user' => [
                    'email' => $email,
                    'role' => 'MASTER',
                    'name' => 'Master Admin'
                ]
            ]);
        } else {
            errorResponse('Неверный пароль', 401);
        }
    }
    
    // Проверяем существование пользователя
    if (!userExists($email)) {
        errorResponse('Пользователь не найден. Свяжитесь с администратором для получения доступа', 403);
    }
    
    // Проверяем пароль
    $user = verifyPassword($email, $password);
    if (!$user) {
        errorResponse('Неверный email или пароль', 401);
    }
    
    // Обновляем время последнего входа
    updateLastLogin($user['id']);
    
    // Генерируем токен
    $token = generateToken($user['id'], $email, $user['role']);
    
    // Получаем полную информацию о пользователе
    $db = getDbConnection();
    $stmt = $db->prepare("SELECT id, email, name, role, status FROM users WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    $userData = $stmt->fetch();
    
    successResponse([
        'token' => $token,
        'user' => $userData
    ]);
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
