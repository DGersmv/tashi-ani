<?php
/**
 * API endpoint для работы с BIM моделями объекта
 * GET /api/user/object-models.php?objectId=123&email=user@example.com - получить список моделей
 */

require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../lib/userManagement.php';

// Загружаем конфигурацию если есть
if (file_exists(__DIR__ . '/../../../config.php')) {
    require_once __DIR__ . '/../../../config.php';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $objectId = isset($_GET['objectId']) ? (int)$_GET['objectId'] : 0;
        $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
        
        if ($objectId <= 0) {
            errorResponse('Неверный ID объекта', 400);
        }
        
        // Проверка авторизации через токен (для админов) или email (для пользователей)
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
        
        // Получаем модели
        $stmt = $db->prepare("
            SELECT 
                bm.*,
                u.id as uploaded_by_id,
                u.name as uploaded_by_name,
                u.email as uploaded_by_email,
                pr.id as project_id,
                pr.title as project_title,
                ps.id as stage_id,
                ps.title as stage_title
            FROM bim_models bm
            LEFT JOIN users u ON bm.uploaded_by = u.id
            LEFT JOIN projects pr ON bm.project_id = pr.id
            LEFT JOIN project_stages ps ON bm.stage_id = ps.id
            WHERE bm.object_id = :object_id
            ORDER BY bm.uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $objectId]);
        $models = $stmt->fetchAll();
        
        // Для каждой модели получаем количество комментариев
        $modelsWithData = [];
        foreach ($models as $model) {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM bim_model_comments WHERE model_id = :model_id");
            $stmt->execute(['model_id' => $model['id']]);
            $commentsCount = (int)$stmt->fetch()['count'];
            
            $modelsWithData[] = [
                'id' => $model['id'],
                'objectId' => $model['object_id'],
                'projectId' => $model['project_id'],
                'stageId' => $model['stage_id'],
                'name' => $model['name'],
                'description' => $model['description'],
                'version' => $model['version'],
                'originalFilename' => $model['original_filename'],
                'originalFilePath' => $model['original_file_path'],
                'originalFileSize' => (int)$model['original_file_size'],
                'originalMimeType' => $model['original_mime_type'],
                'originalFormat' => $model['original_format'],
                'viewableFilename' => $model['viewable_filename'],
                'viewableFilePath' => $model['viewable_file_path'],
                'viewableFileSize' => $model['viewable_file_size'] ? (int)$model['viewable_file_size'] : null,
                'viewableMimeType' => $model['viewable_mime_type'],
                'viewableFormat' => $model['viewable_format'],
                'isVisibleToCustomer' => dbBool($model['is_visible_to_customer']),
                'uploadedAt' => $model['uploaded_at'],
                'uploadedBy' => $model['uploaded_by_id'] ? [
                    'id' => $model['uploaded_by_id'],
                    'name' => $model['uploaded_by_name'],
                    'email' => $model['uploaded_by_email']
                ] : null,
                'project' => $model['project_id'] ? [
                    'id' => $model['project_id'],
                    'title' => $model['project_title']
                ] : null,
                'stage' => $model['stage_id'] ? [
                    'id' => $model['stage_id'],
                    'title' => $model['stage_title']
                ] : null,
                '_count' => [
                    'comments' => $commentsCount
                ]
            ];
        }
        
        successResponse(['models' => $modelsWithData]);
        
    } catch (Exception $e) {
        error_log("User object-models GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
