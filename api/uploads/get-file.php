<?php
/**
 * API endpoint для получения файлов
 * GET /api/uploads/get-file.php?type=photo&objectId=123&filename=image.jpg&email=user@example.com
 * GET /api/uploads/get-file.php?type=panorama&objectId=123&filename=panorama.jpg&email=user@example.com
 * GET /api/uploads/get-file.php?type=document&objectId=123&filename=doc.pdf&email=user@example.com
 * GET /api/uploads/get-file.php?type=project&projectId=456&filename=file.pdf
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    $objectId = isset($_GET['objectId']) ? (int)$_GET['objectId'] : 0;
    $projectId = isset($_GET['projectId']) ? (int)$_GET['projectId'] : 0;
    $filename = isset($_GET['filename']) ? $_GET['filename'] : '';
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    
    if (empty($type) || empty($filename)) {
        errorResponse('Тип файла и имя файла обязательны', 400);
    }
    
    // Валидация имени файла (предотвращение path traversal)
    $sanitizedFilename = basename($filename);
    if ($sanitizedFilename !== $filename) {
        errorResponse('Неверное имя файла', 400);
    }
    
    $db = getDbConnection();
    $filePath = null;
    $mimeType = 'application/octet-stream';
    $originalName = $filename;
    
    if ($type === 'photo') {
        if ($objectId <= 0 || empty($email)) {
            errorResponse('ID объекта и email обязательны', 400);
        }
        
        // Проверяем доступ пользователя к объекту
        $stmt = $db->prepare("
            SELECT o.id FROM objects o
            INNER JOIN users u ON o.user_id = u.id
            WHERE o.id = :object_id AND u.email = :email AND o.status = 'ACTIVE'
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'email' => $email
        ]);
        
        if (!$stmt->fetch()) {
            errorResponse('Доступ запрещен', 403);
        }
        
        // Ищем фото
        $stmt = $db->prepare("
            SELECT file_path, original_name, mime_type
            FROM photos
            WHERE object_id = :object_id AND filename = :filename AND is_visible_to_customer = true
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'filename' => $filename
        ]);
        $photo = $stmt->fetch();
        
        if (!$photo) {
            errorResponse('Фото не найдено', 404);
        }
        
        $relativePath = !empty($photo['file_path']) 
            ? ltrim($photo['file_path'], '/')
            : "uploads/objects/{$objectId}/{$filename}";
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        $mimeType = $photo['mime_type'] ?: 'image/jpeg';
        $originalName = $photo['original_name'] ?: $filename;
        
    } elseif ($type === 'panorama') {
        if ($objectId <= 0 || empty($email)) {
            errorResponse('ID объекта и email обязательны', 400);
        }
        
        // Проверяем доступ пользователя к объекту
        $stmt = $db->prepare("
            SELECT o.id FROM objects o
            INNER JOIN users u ON o.user_id = u.id
            WHERE o.id = :object_id AND u.email = :email AND o.status = 'ACTIVE'
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'email' => $email
        ]);
        
        if (!$stmt->fetch()) {
            errorResponse('Доступ запрещен', 403);
        }
        
        // Ищем панораму
        $stmt = $db->prepare("
            SELECT file_path, original_name, mime_type
            FROM panoramas
            WHERE object_id = :object_id AND filename = :filename AND is_visible_to_customer = true
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'filename' => $filename
        ]);
        $panorama = $stmt->fetch();
        
        if (!$panorama) {
            errorResponse('Панорама не найдена', 404);
        }
        
        $relativePath = !empty($panorama['file_path'])
            ? ltrim($panorama['file_path'], '/')
            : "uploads/objects/{$objectId}/panoramas/{$filename}";
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        $mimeType = $panorama['mime_type'] ?: 'image/jpeg';
        $originalName = $panorama['original_name'] ?: $filename;
        
    } elseif ($type === 'document') {
        if ($objectId <= 0 || empty($email)) {
            errorResponse('ID объекта и email обязательны', 400);
        }
        
        // Проверяем доступ пользователя к объекту
        $stmt = $db->prepare("
            SELECT o.id FROM objects o
            INNER JOIN users u ON o.user_id = u.id
            WHERE o.id = :object_id AND u.email = :email AND o.status = 'ACTIVE'
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'email' => $email
        ]);
        
        if (!$stmt->fetch()) {
            errorResponse('Доступ запрещен', 403);
        }
        
        // Ищем документ
        $stmt = $db->prepare("
            SELECT file_path, original_name, mime_type
            FROM documents
            WHERE object_id = :object_id AND filename = :filename
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'filename' => $filename
        ]);
        $document = $stmt->fetch();
        
        if (!$document) {
            errorResponse('Документ не найден', 404);
        }
        
        $relativePath = !empty($document['file_path'])
            ? ltrim($document['file_path'], '/')
            : "uploads/objects/{$objectId}/{$filename}";
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        $mimeType = $document['mime_type'] ?: 'application/pdf';
        $originalName = $document['original_name'] ?: $filename;
        
    } elseif ($type === 'project') {
        if ($projectId <= 0) {
            errorResponse('ID проекта обязателен', 400);
        }
        
        // Ищем файл проекта (доступ без проверки email для упрощения)
        $relativePath = "uploads/projects/{$projectId}/" . urldecode($filename);
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        
        // Определяем MIME тип по расширению
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if ($ext === 'pdf') {
            $mimeType = 'application/pdf';
        } elseif (in_array($ext, ['jpg', 'jpeg'])) {
            $mimeType = 'image/jpeg';
        } elseif ($ext === 'png') {
            $mimeType = 'image/png';
        } elseif ($ext === 'gif') {
            $mimeType = 'image/gif';
        } elseif ($ext === 'webp') {
            $mimeType = 'image/webp';
        }
        
    } else {
        errorResponse('Неверный тип файла', 400);
    }
    
    // Проверяем существование файла
    if (!file_exists($filePath)) {
        error_log("File not found: $filePath");
        errorResponse('Файл не найден на сервере', 404);
    }
    
    // Проверяем, что файл находится в разрешенной директории (предотвращение path traversal)
    $realPath = realpath($filePath);
    $publicPath = realpath(__DIR__ . '/../../public');
    
    if (!$realPath || strpos($realPath, $publicPath) !== 0) {
        error_log("Path traversal attempt: $filePath");
        errorResponse('Неверный путь к файлу', 403);
    }
    
    // Читаем файл
    $fileContent = file_get_contents($realPath);
    if ($fileContent === false) {
        errorResponse('Ошибка чтения файла', 500);
    }
    
    // Отправляем файл
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . strlen($fileContent));
    header('Content-Disposition: inline; filename="' . addslashes($originalName) . '"');
    header('Cache-Control: public, max-age=31536000');
    
    echo $fileContent;
    exit;
    
} catch (Exception $e) {
    error_log("Get file error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
