<?php
/**
 * API endpoint для скачивания BIM модели
 * GET /api/user/model-download.php?objectId=123&modelId=456&email=user@example.com&type=original|viewable
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
    $objectId = isset($_GET['objectId']) ? (int)$_GET['objectId'] : 0;
    $modelId = isset($_GET['modelId']) ? (int)$_GET['modelId'] : 0;
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    $fileType = isset($_GET['type']) ? $_GET['type'] : 'original'; // 'original' или 'viewable'
    
    if ($objectId <= 0 || $modelId <= 0) {
        errorResponse('Неверный ID', 400);
    }
    
    // Проверка авторизации
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $isAdminRequest = false;
    $userEmail = $email;
    
    if (!empty($authHeader) && strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $decoded = verifyToken($token);
        if ($decoded && ($decoded['role'] === 'MASTER' || $decoded['role'] === 'ADMIN')) {
            $isAdminRequest = true;
            $userEmail = $decoded['email'];
        }
    }
    
    if (empty($userEmail)) {
        errorResponse('Email не предоставлен', 400);
    }
    
    $db = getDbConnection();
    
    // Проверка доступа к объекту
    if (!$isAdminRequest) {
        $stmt = $db->prepare("
            SELECT o.id FROM objects o
            INNER JOIN users u ON o.user_id = u.id
            WHERE o.id = :object_id AND u.email = :email
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'email' => $userEmail
        ]);
        
        if (!$stmt->fetch()) {
            errorResponse('Объект не найден или нет доступа', 404);
        }
    }
    
    // Получаем модель
    $stmt = $db->prepare("
        SELECT * FROM bim_models
        WHERE id = :model_id AND object_id = :object_id
    ");
    $stmt->execute([
        'model_id' => $modelId,
        'object_id' => $objectId
    ]);
    $model = $stmt->fetch();
    
    if (!$model) {
        errorResponse('Модель не найдена', 404);
    }
    
    // Определяем какой файл скачивать
    $filePath = null;
    $filename = null;
    $mimeType = null;
    
    if ($fileType === 'viewable') {
        if (empty($model['viewable_file_path']) || empty($model['viewable_filename'])) {
            errorResponse('Файл для просмотра не найден', 404);
        }
        $relativePath = ltrim($model['viewable_file_path'], '/');
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        $filename = $model['viewable_filename'];
        $mimeType = $model['viewable_mime_type'] ?: 'application/octet-stream';
    } else {
        // original
        if (empty($model['original_file_path'])) {
            errorResponse('Исходный файл не найден', 404);
        }
        $relativePath = ltrim($model['original_file_path'], '/');
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        $filename = $model['original_filename'];
        $mimeType = $model['original_mime_type'] ?: 'application/octet-stream';
    }
    
    // Проверяем существование файла
    if (!file_exists($filePath)) {
        errorResponse('Файл не найден на сервере', 404);
    }
    
    // Проверяем безопасность пути
    $realPath = realpath($filePath);
    $publicPath = realpath(__DIR__ . '/../../public');
    
    if (!$realPath || strpos($realPath, $publicPath) !== 0) {
        errorResponse('Неверный путь к файлу', 403);
    }
    
    // Читаем файл
    $fileContent = file_get_contents($realPath);
    if ($fileContent === false) {
        errorResponse('Ошибка чтения файла', 500);
    }
    
    // Отправляем файл для скачивания
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . urlencode($filename) . '"');
    header('Content-Length: ' . strlen($fileContent));
    
    echo $fileContent;
    exit;
    
} catch (Exception $e) {
    error_log("User model-download error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
