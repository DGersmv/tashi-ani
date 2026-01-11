<?php
/**
 * API endpoint для пометки комментариев к фото как прочитанных
 * PATCH /api/photo-comments/mark-read.php?email=user@example.com&isAdmin=false&photoId=123
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/userManagement.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

try {
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    $isAdmin = isset($_GET['isAdmin']) && $_GET['isAdmin'] === 'true';
    $photoId = isset($_GET['photoId']) ? (int)$_GET['photoId'] : null;
    
    if (empty($email)) {
        errorResponse('Email не предоставлен', 400);
    }
    
    // Проверяем, что пользователь существует
    $db = getDbConnection();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Пользователь не найден', 404);
    }
    
    // Формируем условие для поиска комментариев
    $whereConditions = [];
    $params = [];
    
    if ($photoId !== null && $photoId > 0) {
        $whereConditions[] = "photo_id = :photo_id";
        $params['photo_id'] = $photoId;
    }
    
    if ($isAdmin) {
        // Админ помечает комментарии от заказчиков как прочитанные
        $whereConditions[] = "is_admin_comment = false";
    } else {
        // Заказчик помечает комментарии от админа как прочитанные
        $whereConditions[] = "is_admin_comment = true";
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Определяем поле для обновления
    $updateField = $isAdmin ? 'is_read_by_admin' : 'is_read_by_customer';
    
    // Обновляем комментарии (используем безопасный способ для динамического поля)
    $sql = "UPDATE photo_comments SET $updateField = true, updated_at = NOW() $whereClause";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    successResponse(['message' => 'Комментарии помечены как прочитанные']);
    
} catch (Exception $e) {
    error_log("Photo comments mark-read error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
