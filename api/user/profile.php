<?php
/**
 * API endpoint для получения профиля пользователя
 * GET /api/user/profile.php?email=user@example.com
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    
    if (empty($email)) {
        errorResponse('Email обязателен', 400);
    }
    
    $db = getDbConnection();
    $stmt = $db->prepare("
        SELECT id, email, name, role, status, createdAt, lastLogin 
        FROM users 
        WHERE email = :email
    ");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Пользователь не найден', 404);
    }
    
    successResponse([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'status' => $user['status'],
            'createdAt' => $user['createdat'],
            'lastLogin' => $user['lastlogin']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Profile error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
