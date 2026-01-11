<?php
/**
 * API endpoint для работы с комментариями к фото
 * GET /api/photo-comments.php?photoId=123 - получить комментарии
 * POST /api/photo-comments.php - добавить комментарий (требуется токен)
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $photoId = isset($_GET['photoId']) ? (int)$_GET['photoId'] : 0;
        
        if ($photoId <= 0) {
            errorResponse('ID фото обязателен', 400);
        }
        
        $db = getDbConnection();
        $stmt = $db->prepare("
            SELECT 
                pc.*,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role
            FROM photo_comments pc
            LEFT JOIN users u ON pc.user_id = u.id
            WHERE pc.photo_id = :photo_id
            ORDER BY pc.created_at ASC
        ");
        $stmt->execute(['photo_id' => $photoId]);
        $comments = $stmt->fetchAll();
        
        // Форматируем комментарии
        $formattedComments = array_map(function($comment) {
            return [
                'id' => $comment['id'],
                'photoId' => $comment['photo_id'],
                'userId' => $comment['user_id'],
                'content' => $comment['content'],
                'isAdminComment' => dbBool($comment['is_admin_comment']),
                'isReadByCustomer' => dbBool($comment['is_read_by_customer']),
                'isReadByAdmin' => dbBool($comment['is_read_by_admin']),
                'createdAt' => $comment['created_at'],
                'updatedAt' => $comment['updated_at'],
                'user' => [
                    'id' => $comment['user_id'],
                    'name' => $comment['user_name'],
                    'email' => $comment['user_email'],
                    'role' => $comment['user_role']
                ]
            ];
        }, $comments);
        
        successResponse(['comments' => $formattedComments]);
        
    } catch (Exception $e) {
        error_log("Photo comments GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Проверяем авторизацию
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
            errorResponse('Требуется авторизация', 401);
        }
        
        $token = substr($authHeader, 7);
        $decodedToken = verifyToken($token);
        
        if (!$decodedToken) {
            errorResponse('Неверный токен', 401);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $photoId = isset($input['photoId']) ? (int)$input['photoId'] : 0;
        $content = isset($input['content']) ? trim($input['content']) : '';
        
        if ($photoId <= 0 || empty($content)) {
            errorResponse('ID фото и содержание комментария обязательны', 400);
        }
        
        // Проверяем, что фото существует
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id FROM photos WHERE id = :photo_id");
        $stmt->execute(['photo_id' => $photoId]);
        
        if (!$stmt->fetch()) {
            errorResponse('Фото не найдено', 404);
        }
        
        // Определяем, является ли комментарий админским
        $isAdminComment = ($decodedToken['role'] === 'MASTER' || $decodedToken['role'] === 'ADMIN');
        
        // Создаем комментарий
        $stmt = $db->prepare("
            INSERT INTO photo_comments (photo_id, user_id, content, is_admin_comment, created_at, updated_at)
            VALUES (:photo_id, :user_id, :content, :is_admin_comment, NOW(), NOW())
            RETURNING id, photo_id, user_id, content, is_admin_comment, is_read_by_customer, is_read_by_admin, created_at, updated_at
        ");
        $stmt->execute([
            'photo_id' => $photoId,
            'user_id' => $decodedToken['userId'],
            'content' => $content,
            'is_admin_comment' => $isAdminComment ? 'true' : 'false'
        ]);
        $comment = $stmt->fetch();
        
        // Получаем информацию о пользователе
        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $decodedToken['userId']]);
        $user = $stmt->fetch();
        
        successResponse([
            'comment' => [
                'id' => $comment['id'],
                'photoId' => $comment['photo_id'],
                'userId' => $comment['user_id'],
                'content' => $comment['content'],
                'isAdminComment' => dbBool($comment['is_admin_comment']),
                'isReadByCustomer' => dbBool($comment['is_read_by_customer']),
                'isReadByAdmin' => dbBool($comment['is_read_by_admin']),
                'createdAt' => $comment['created_at'],
                'updatedAt' => $comment['updated_at'],
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Photo comments POST error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
