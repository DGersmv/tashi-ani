<?php
/**
 * API endpoint для получения количества непрочитанных уведомлений
 * GET /api/notifications/unread.php?email=user@example.com&isAdmin=false
 */

require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../lib/userManagement.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    $isAdmin = isset($_GET['isAdmin']) && $_GET['isAdmin'] === 'true';
    
    if (empty($email)) {
        errorResponse('Email не предоставлен', 400);
    }
    
    $db = getDbConnection();
    
    // Получаем пользователя с его объектами
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Пользователь не найден', 404);
    }
    
    // Получаем ID объектов пользователя
    $stmt = $db->prepare("SELECT id FROM objects WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $user['id']]);
    $objects = $stmt->fetchAll();
    $objectIds = array_column($objects, 'id');
    
    if (empty($objectIds)) {
        successResponse([
            'unreadMessages' => 0,
            'unreadComments' => 0,
            'total' => 0
        ]);
    }
    
    $placeholders = implode(',', array_fill(0, count($objectIds), '?'));
    
    if ($isAdmin) {
        // Для админа считаем непрочитанные сообщения от заказчиков
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM messages
            WHERE object_id IN ($placeholders)
            AND is_admin_message = false
            AND is_read_by_admin = false
        ");
        $stmt->execute($objectIds);
        $unreadMessages = (int)$stmt->fetch()['count'];
        
        // Комментарии от заказчиков к фото
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM photo_comments pc
            INNER JOIN photos p ON p.id = pc.photo_id
            WHERE p.object_id IN ($placeholders)
            AND pc.is_admin_comment = false
            AND pc.is_read_by_admin = false
        ");
        $stmt->execute($objectIds);
        $unreadComments = (int)$stmt->fetch()['count'];
        
    } else {
        // Для заказчика считаем непрочитанные сообщения от админа
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM messages
            WHERE object_id IN ($placeholders)
            AND is_admin_message = true
            AND is_read_by_customer = false
        ");
        $stmt->execute($objectIds);
        $unreadMessages = (int)$stmt->fetch()['count'];
        
        // Комментарии от админа к фото
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM photo_comments pc
            INNER JOIN photos p ON p.id = pc.photo_id
            WHERE p.object_id IN ($placeholders)
            AND pc.is_admin_comment = true
            AND pc.is_read_by_customer = false
        ");
        $stmt->execute($objectIds);
        $unreadComments = (int)$stmt->fetch()['count'];
    }
    
    successResponse([
        'unreadMessages' => $unreadMessages,
        'unreadComments' => $unreadComments,
        'total' => $unreadMessages + $unreadComments
    ]);
    
} catch (Exception $e) {
    error_log("Notifications unread error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
