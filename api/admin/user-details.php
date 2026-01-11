<?php
/**
 * API endpoint для получения детальной информации о пользователе (админка)
 * GET /api/admin/user-details.php?id=123
 * PUT /api/admin/user-details.php?id=123
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/userManagement.php';

// Загружаем конфигурацию если есть
if (file_exists(__DIR__ . '/../../config.php')) {
    require_once __DIR__ . '/../../config.php';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

// Проверка авторизации мастера-админа
function authenticateMasterAdmin() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        return null;
    }
    
    $token = substr($authHeader, 7);
    $adminData = verifyToken($token);
    
    if (!$adminData || $adminData['role'] !== 'MASTER') {
        return null;
    }
    
    return $adminData;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $admin = authenticateMasterAdmin();
        if (!$admin) {
            errorResponse('Доступ запрещен. Требуются права администратора', 403);
        }
        
        $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($userId <= 0) {
            errorResponse('Неверный ID пользователя', 400);
        }
        
        $db = getDbConnection();
        
        // Получаем пользователя с полной информацией
        $stmt = $db->prepare("SELECT * FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            errorResponse('Пользователь не найден', 404);
        }
        
        // Получаем объекты пользователя
        $stmt = $db->prepare("
            SELECT o.*,
                COUNT(DISTINCT p.id) as photos_count,
                COUNT(DISTINCT d.id) as documents_count,
                COUNT(DISTINCT pr.id) as projects_count,
                COUNT(DISTINCT m.id) as messages_count
            FROM objects o
            LEFT JOIN photos p ON p.object_id = o.id
            LEFT JOIN documents d ON d.object_id = o.id
            LEFT JOIN projects pr ON pr.object_id = o.id
            LEFT JOIN messages m ON m.object_id = o.id
            WHERE o.user_id = :user_id
            GROUP BY o.id
        ");
        $stmt->execute(['user_id' => $userId]);
        $objects = $stmt->fetchAll();
        
        // Получаем сообщения пользователя
        $stmt = $db->prepare("SELECT * FROM messages WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->execute(['user_id' => $userId]);
        $messages = $stmt->fetchAll();
        
        // Получаем комментарии пользователя
        $stmt = $db->prepare("SELECT * FROM photo_comments WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->execute(['user_id' => $userId]);
        $photoComments = $stmt->fetchAll();
        
        $stmt = $db->prepare("SELECT * FROM panorama_comments WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->execute(['user_id' => $userId]);
        $panoramaComments = $stmt->fetchAll();
        
        successResponse([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'status' => $user['status'],
                'createdAt' => $user['created_at'],
                'lastLogin' => $user['last_login'],
                'objects' => $objects,
                'messages' => $messages,
                'photoComments' => $photoComments,
                'panoramaComments' => $panoramaComments
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin user-details GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $admin = authenticateMasterAdmin();
        if (!$admin) {
            errorResponse('Доступ запрещен. Требуются права администратора', 403);
        }
        
        $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($userId <= 0) {
            errorResponse('Неверный ID пользователя', 400);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $db = getDbConnection();
        
        // Проверяем, существует ли пользователь
        $stmt = $db->prepare("SELECT id FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        
        if (!$stmt->fetch()) {
            errorResponse('Пользователь не найден', 404);
        }
        
        // Формируем запрос обновления
        $updateFields = [];
        $params = ['user_id' => $userId];
        
        if (isset($input['email'])) {
            $updateFields[] = "email = :email";
            $params['email'] = trim(strtolower($input['email']));
        }
        
        if (isset($input['name'])) {
            $updateFields[] = "name = :name";
            $params['name'] = trim($input['name']) ?: null;
        }
        
        if (isset($input['role'])) {
            $updateFields[] = "role = :role";
            $params['role'] = $input['role'];
        }
        
        if (isset($input['status'])) {
            $updateFields[] = "status = :status";
            $params['status'] = $input['status'];
        }
        
        if (isset($input['password']) && !empty($input['password'])) {
            if (strlen($input['password']) < 6) {
                errorResponse('Пароль должен содержать минимум 6 символов', 400);
            }
            $updateFields[] = "password = :password";
            $params['password'] = password_hash($input['password'], PASSWORD_BCRYPT);
        }
        
        if (empty($updateFields)) {
            errorResponse('Нечего обновлять', 400);
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :user_id RETURNING id, email, name, role, status, created_at";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $updatedUser = $stmt->fetch();
        
        successResponse([
            'user' => [
                'id' => $updatedUser['id'],
                'email' => $updatedUser['email'],
                'name' => $updatedUser['name'],
                'role' => $updatedUser['role'],
                'status' => $updatedUser['status'],
                'createdAt' => $updatedUser['created_at']
            ],
            'message' => 'Пользователь успешно обновлен'
        ]);
        
    } catch (Exception $e) {
        error_log("Admin user-details PUT error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
