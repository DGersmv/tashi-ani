<?php
/**
 * API endpoint для работы с сообщениями
 * POST /api/messages.php - создать сообщение
 * DELETE /api/messages.php?messageId=123 - удалить сообщение (только админ)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/userManagement.php';

// Загружаем конфигурацию если есть
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $content = isset($input['content']) ? trim($input['content']) : '';
        $objectId = isset($input['objectId']) ? (int)$input['objectId'] : null;
        $projectId = isset($input['projectId']) ? (int)$input['projectId'] : null;
        $isAdminMessage = isset($input['isAdminMessage']) ? (bool)$input['isAdminMessage'] : false;
        $userEmail = isset($input['userEmail']) ? trim(strtolower($input['userEmail'])) : '';
        
        if (empty($content)) {
            errorResponse('Содержимое сообщения обязательно', 400);
        }
        
        if (!$objectId && !$projectId) {
            errorResponse('ID объекта или проекта обязателен', 400);
        }
        
        $userId = null;
        
        // Проверяем авторизацию
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!empty($authHeader) && strpos($authHeader, 'Bearer ') === 0) {
            // Админ с токеном
            $token = substr($authHeader, 7);
            $userData = verifyToken($token);
            
            if (!$userData) {
                errorResponse('Недействительный токен авторизации', 401);
            }
            
            $userId = $userData['userId'];
        } elseif (!empty($userEmail)) {
            // Заказчик без токена - находим пользователя по email
            $db = getDbConnection();
            $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute(['email' => $userEmail]);
            $user = $stmt->fetch();
            
            if (!$user) {
                errorResponse('Пользователь не найден', 404);
            }
            
            $userId = $user['id'];
        } else {
            errorResponse('Необходима авторизация или email пользователя', 401);
        }
        
        // Создаем сообщение
        $db = getDbConnection();
        $stmt = $db->prepare("
            INSERT INTO messages (content, object_id, project_id, user_id, is_admin_message, created_at, updated_at)
            VALUES (:content, :object_id, :project_id, :user_id, :is_admin_message, NOW(), NOW())
            RETURNING id, content, object_id, project_id, user_id, is_admin_message, created_at, updated_at
        ");
        $stmt->execute([
            'content' => $content,
            'object_id' => $objectId,
            'project_id' => $projectId,
            'user_id' => $userId,
            'is_admin_message' => $isAdminMessage ? 'true' : 'false'
        ]);
        $message = $stmt->fetch();
        
        // Получаем информацию о пользователе
        $stmt = $db->prepare("SELECT name, email FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $user = $stmt->fetch();
        
        successResponse([
            'message' => 'Сообщение отправлено',
            'data' => [
                'id' => $message['id'],
                'content' => $message['content'],
                'objectId' => $message['object_id'],
                'projectId' => $message['project_id'],
                'userId' => $message['user_id'],
                'isAdminMessage' => dbBool($message['is_admin_message']),
                'createdAt' => $message['created_at'],
                'updatedAt' => $message['updated_at'],
                'user' => [
                    'name' => $user['name'],
                    'email' => $user['email']
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Messages POST error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Проверяем авторизацию админа
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
            errorResponse('Не авторизован', 401);
        }
        
        $token = substr($authHeader, 7);
        $adminData = verifyToken($token);
        
        if (!$adminData || ($adminData['role'] !== 'ADMIN' && $adminData['role'] !== 'MASTER')) {
            errorResponse('Недостаточно прав', 403);
        }
        
        $messageId = isset($_GET['messageId']) ? (int)$_GET['messageId'] : 0;
        
        if ($messageId <= 0) {
            errorResponse('ID сообщения обязателен', 400);
        }
        
        // Удаляем сообщение
        $db = getDbConnection();
        $stmt = $db->prepare("DELETE FROM messages WHERE id = :message_id");
        $stmt->execute(['message_id' => $messageId]);
        
        successResponse(['message' => 'Сообщение удалено']);
        
    } catch (Exception $e) {
        error_log("Messages DELETE error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
