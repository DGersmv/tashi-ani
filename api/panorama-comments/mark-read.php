<?php
/**
 * API endpoint для пометки комментариев к панорамам как прочитанных
 * PATCH /api/panorama-comments/mark-read.php?email=user@example.com&isAdmin=false&panoramaId=123
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
    $panoramaId = isset($_GET['panoramaId']) ? (int)$_GET['panoramaId'] : null;
    
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
    
    if ($panoramaId !== null && $panoramaId > 0) {
        $whereConditions[] = "panorama_id = :panorama_id";
        $params['panorama_id'] = $panoramaId;
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
    $sql = "UPDATE panorama_comments SET $updateField = true, updated_at = NOW() $whereClause";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    successResponse(['message' => 'Комментарии помечены как прочитанные']);
    
} catch (Exception $e) {
    error_log("Panorama comments mark-read error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
