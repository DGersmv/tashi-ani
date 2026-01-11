<?php
/**
 * API endpoint для пометки сообщений как прочитанных
 * PATCH /api/messages/mark-read.php?email=user@example.com&isAdmin=false&objectId=123
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
    $objectId = isset($_GET['objectId']) ? (int)$_GET['objectId'] : null;
    
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
    
    // Формируем условие для поиска сообщений
    $whereConditions = [];
    $params = [];
    
    if ($objectId !== null && $objectId > 0) {
        $whereConditions[] = "object_id = :object_id";
        $params['object_id'] = $objectId;
    }
    
    if ($isAdmin) {
        // Админ помечает сообщения от заказчиков как прочитанные
        $whereConditions[] = "is_admin_message = false";
    } else {
        // Заказчик помечает сообщения от админа как прочитанные
        $whereConditions[] = "is_admin_message = true";
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Определяем поле для обновления
    $updateField = $isAdmin ? 'is_read_by_admin' : 'is_read_by_customer';
    
    // Обновляем сообщения (используем безопасный способ для динамического поля)
    $sql = "UPDATE messages SET $updateField = true, updated_at = NOW() $whereClause";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    successResponse(['message' => 'Сообщения помечены как прочитанные']);
    
} catch (Exception $e) {
    error_log("Messages mark-read error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
