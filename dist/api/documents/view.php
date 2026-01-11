<?php
/**
 * API endpoint для просмотра документа
 * GET /api/documents/view.php?id=123
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $documentId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($documentId <= 0) {
        errorResponse('ID документа обязателен', 400);
    }
    
    $db = getDbConnection();
    
    // Получаем информацию о документе
    $stmt = $db->prepare("
        SELECT id, filename, original_name, file_path, mime_type, is_paid, document_type
        FROM documents
        WHERE id = :document_id
    ");
    $stmt->execute(['document_id' => $documentId]);
    $document = $stmt->fetch();
    
    if (!$document) {
        errorResponse('Документ не найден', 404);
    }
    
    // Проверяем статус оплаты
    if (!dbBool($document['is_paid']) && $document['is_paid'] !== true) {
        errorResponse('Документ не оплачен', 403);
    }
    
    // Определяем путь к файлу
    $filePath = null;
    if (!empty($document['file_path'])) {
        $relativePath = ltrim($document['file_path'], '/');
        $filePath = __DIR__ . '/../../public/' . $relativePath;
    } else {
        // Пробуем найти файл по стандартному пути
        $filePath = __DIR__ . '/../../public/uploads/objects/' . $document['filename'];
    }
    
    // Проверяем существование файла
    if (!file_exists($filePath)) {
        // Пробуем альтернативный путь
        $altPath = __DIR__ . '/../../public/' . $document['filename'];
        if (file_exists($altPath)) {
            $filePath = $altPath;
        } else {
            errorResponse('Файл не найден на сервере', 404);
        }
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
    
    // Отправляем файл
    header('Content-Type: ' . ($document['mime_type'] ?: 'application/pdf'));
    header('Content-Disposition: inline; filename="' . addslashes($document['original_name']) . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Length: ' . strlen($fileContent));
    
    echo $fileContent;
    exit;
    
} catch (Exception $e) {
    error_log("Documents view error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
