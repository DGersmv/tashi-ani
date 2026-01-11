<?php
/**
 * API endpoint для просмотра BIM модели
 * GET /api/user/model-view.php?objectId=123&modelId=456&email=user@example.com
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
    
    // Проверяем наличие файла для просмотра
    if (empty($model['viewable_file_path']) || empty($model['viewable_filename'])) {
        errorResponse('Файл для просмотра не загружен. Пожалуйста, загрузите IFC или glTF файл.', 404);
    }
    
    $relativePath = ltrim($model['viewable_file_path'], '/');
    $filePath = __DIR__ . '/../../public/' . $relativePath;
    
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
    
    // Определяем MIME тип
    $mimeType = $model['viewable_mime_type'] ?: 'application/octet-stream';
    if ($model['viewable_format'] === 'IFC') {
        $mimeType = 'application/ifc';
    } elseif ($model['viewable_format'] === 'GLTF') {
        $ext = strtolower(pathinfo($model['viewable_filename'], PATHINFO_EXTENSION));
        $mimeType = $ext === 'glb' ? 'model/gltf-binary' : 'model/gltf+json';
    }
    
    // Отправляем файл
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . strlen($fileContent));
    header('Cache-Control: private, max-age=3600');
    header('Access-Control-Allow-Origin: *');
    
    echo $fileContent;
    exit;
    
} catch (Exception $e) {
    error_log("User model-view error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
