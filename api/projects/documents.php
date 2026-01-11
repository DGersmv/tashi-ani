<?php
/**
 * API endpoint для работы с документами проекта
 * GET /api/projects/documents.php?id=123 - получить документы проекта
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/userManagement.php';

// Загружаем конфигурацию если есть
if (file_exists(__DIR__ . '/../../config.php')) {
    require_once __DIR__ . '/../../config.php';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Проверяем авторизацию
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
            errorResponse('Токен авторизации не предоставлен', 401);
        }
        
        $token = substr($authHeader, 7);
        $userData = verifyToken($token);
        
        if (!$userData) {
            errorResponse('Недействительный токен', 401);
        }
        
        $projectId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($projectId <= 0) {
            errorResponse('ID проекта обязателен', 400);
        }
        
        $db = getDbConnection();
        
        // Получаем документы проекта
        $stmt = $db->prepare("
            SELECT id, filename, original_name, mime_type, file_size, uploaded_at, is_paid, document_type
            FROM documents
            WHERE project_id = :project_id
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute(['project_id' => $projectId]);
        $documents = $stmt->fetchAll();
        
        // Форматируем документы
        $formattedDocuments = array_map(function($doc) {
            return [
                'id' => $doc['id'],
                'filename' => $doc['filename'],
                'originalName' => $doc['original_name'],
                'mimeType' => $doc['mime_type'],
                'fileSize' => (int)$doc['file_size'],
                'uploadedAt' => $doc['uploaded_at'],
                'isPaid' => dbBool($doc['is_paid']),
                'documentType' => $doc['document_type']
            ];
        }, $documents);
        
        successResponse(['documents' => $formattedDocuments]);
        
    } catch (Exception $e) {
        error_log("Projects documents GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
