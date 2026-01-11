<?php
/**
 * API endpoint для работы с комментариями к панорамам
 * GET /api/panorama-comments.php?panoramaId=123 - получить комментарии
 * POST /api/panorama-comments.php - добавить комментарий (требуется токен)
 * DELETE /api/panorama-comments.php?commentId=123 - удалить комментарий (только админ)
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
        $panoramaId = isset($_GET['panoramaId']) ? (int)$_GET['panoramaId'] : 0;
        
        if ($panoramaId <= 0) {
            errorResponse('ID панорамы обязателен', 400);
        }
        
        $db = getDbConnection();
        $stmt = $db->prepare("
            SELECT 
                pc.*,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role
            FROM panorama_comments pc
            LEFT JOIN users u ON pc.user_id = u.id
            WHERE pc.panorama_id = :panorama_id
            ORDER BY pc.created_at ASC
        ");
        $stmt->execute(['panorama_id' => $panoramaId]);
        $comments = $stmt->fetchAll();
        
        // Форматируем комментарии
        $formattedComments = array_map(function($comment) {
            return [
                'id' => $comment['id'],
                'panoramaId' => $comment['panorama_id'],
                'userId' => $comment['user_id'],
                'content' => $comment['content'],
                'yaw' => $comment['yaw'] !== null ? (float)$comment['yaw'] : null,
                'pitch' => $comment['pitch'] !== null ? (float)$comment['pitch'] : null,
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
        error_log("Panorama comments GET error: " . $e->getMessage());
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
        
        $panoramaId = isset($input['panoramaId']) ? (int)$input['panoramaId'] : 0;
        $content = isset($input['content']) ? trim($input['content']) : '';
        $yaw = isset($input['yaw']) ? ($input['yaw'] !== null ? (float)$input['yaw'] : null) : null;
        $pitch = isset($input['pitch']) ? ($input['pitch'] !== null ? (float)$input['pitch'] : null) : null;
        
        if ($panoramaId <= 0 || empty($content)) {
            errorResponse('ID панорамы и содержание комментария обязательны', 400);
        }
        
        // Проверка координат
        $coordinatesProvided = ($yaw !== null || $pitch !== null);
        if ($coordinatesProvided && ($yaw === null || $pitch === null || !is_numeric($yaw) || !is_numeric($pitch))) {
            errorResponse('Координаты комментария, если переданы, должны быть числами', 400);
        }
        
        // Проверяем, что панорама существует
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id FROM panoramas WHERE id = :panorama_id");
        $stmt->execute(['panorama_id' => $panoramaId]);
        
        if (!$stmt->fetch()) {
            errorResponse('Панорама не найдена', 404);
        }
        
        // Определяем, является ли комментарий админским
        $isAdminComment = ($decodedToken['role'] === 'MASTER' || $decodedToken['role'] === 'ADMIN');
        
        // Создаем комментарий
        $stmt = $db->prepare("
            INSERT INTO panorama_comments (panorama_id, user_id, content, yaw, pitch, is_admin_comment, created_at, updated_at)
            VALUES (:panorama_id, :user_id, :content, :yaw, :pitch, :is_admin_comment, NOW(), NOW())
            RETURNING id, panorama_id, user_id, content, yaw, pitch, is_admin_comment, is_read_by_customer, is_read_by_admin, created_at, updated_at
        ");
        $stmt->execute([
            'panorama_id' => $panoramaId,
            'user_id' => $decodedToken['userId'],
            'content' => $content,
            'yaw' => $yaw,
            'pitch' => $pitch,
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
                'panoramaId' => $comment['panorama_id'],
                'userId' => $comment['user_id'],
                'content' => $comment['content'],
                'yaw' => $comment['yaw'] !== null ? (float)$comment['yaw'] : null,
                'pitch' => $comment['pitch'] !== null ? (float)$comment['pitch'] : null,
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
        error_log("Panorama comments POST error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Проверяем авторизацию админа
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
            errorResponse('Требуется авторизация', 401);
        }
        
        $token = substr($authHeader, 7);
        $decodedToken = verifyToken($token);
        
        if (!$decodedToken || ($decodedToken['role'] !== 'MASTER' && $decodedToken['role'] !== 'ADMIN')) {
            errorResponse('Недостаточно прав', 403);
        }
        
        $commentId = isset($_GET['commentId']) ? (int)$_GET['commentId'] : 0;
        
        if ($commentId <= 0) {
            errorResponse('ID комментария обязателен', 400);
        }
        
        // Проверяем, что комментарий существует
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id FROM panorama_comments WHERE id = :comment_id");
        $stmt->execute(['comment_id' => $commentId]);
        
        if (!$stmt->fetch()) {
            errorResponse('Комментарий не найден', 404);
        }
        
        // Удаляем комментарий
        $stmt = $db->prepare("DELETE FROM panorama_comments WHERE id = :comment_id");
        $stmt->execute(['comment_id' => $commentId]);
        
        successResponse(['deletedCommentId' => $commentId]);
        
    } catch (Exception $e) {
        error_log("Panorama comments DELETE error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
