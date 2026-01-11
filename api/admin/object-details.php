<?php
/**
 * API endpoint для получения детальной информации об объекте (админка)
 * GET /api/admin/object-details.php?id=123&userId=456
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

// Проверка авторизации админа
function authenticateAdmin() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        return null;
    }
    
    $token = substr($authHeader, 7);
    $adminData = verifyToken($token);
    
    if (!$adminData || ($adminData['role'] !== 'ADMIN' && $adminData['role'] !== 'MASTER')) {
        return null;
    }
    
    return $adminData;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Недостаточно прав для просмотра объекта', 403);
        }
        
        $objectId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;
        
        if ($objectId <= 0 || $userId <= 0) {
            errorResponse('ID объекта и пользователя обязательны', 400);
        }
        
        $db = getDbConnection();
        
        // Получаем объект с полной информацией
        $stmt = $db->prepare("
            SELECT * FROM objects
            WHERE id = :object_id AND user_id = :user_id
        ");
        $stmt->execute([
            'object_id' => $objectId,
            'user_id' => $userId
        ]);
        $object = $stmt->fetch();
        
        if (!$object) {
            errorResponse('Объект не найден', 404);
        }
        
        // Получаем пользователя
        $stmt = $db->prepare("SELECT id, email, name FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $user = $stmt->fetch();
        
        // Получаем проекты
        $stmt = $db->prepare("
            SELECT p.*,
                COUNT(DISTINCT d.id) as documents_count,
                COUNT(DISTINCT ph.id) as photos_count,
                COUNT(DISTINCT m.id) as messages_count
            FROM projects p
            LEFT JOIN documents d ON d.project_id = p.id
            LEFT JOIN photos ph ON ph.project_stage_id IN (SELECT id FROM project_stages WHERE project_id = p.id)
            LEFT JOIN messages m ON m.project_id = p.id
            WHERE p.object_id = :object_id
            GROUP BY p.id
        ");
        $stmt->execute(['object_id' => $objectId]);
        $projects = $stmt->fetchAll();
        
        // Для каждого проекта получаем документы
        foreach ($projects as &$project) {
            $stmt = $db->prepare("
                SELECT id, filename, original_name, mime_type, file_size, uploaded_at, is_paid, document_type
                FROM documents
                WHERE project_id = :project_id
                ORDER BY uploaded_at DESC
            ");
            $stmt->execute(['project_id' => $project['id']]);
            $project['documents'] = $stmt->fetchAll();
        }
        
        // Получаем фото
        $stmt = $db->prepare("
            SELECT p.*, pf.id as folder_id, pf.name as folder_name
            FROM photos p
            LEFT JOIN photo_folders pf ON p.folder_id = pf.id
            WHERE p.object_id = :object_id
            ORDER BY p.uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $objectId]);
        $photos = $stmt->fetchAll();
        
        // Получаем панорамы
        $stmt = $db->prepare("
            SELECT * FROM panoramas
            WHERE object_id = :object_id
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $objectId]);
        $panoramas = $stmt->fetchAll();
        
        // Получаем BIM модели
        $stmt = $db->prepare("
            SELECT bm.*, u.id as uploaded_by_id, u.email as uploaded_by_email, u.name as uploaded_by_name
            FROM bim_models bm
            LEFT JOIN users u ON bm.uploaded_by = u.id
            WHERE bm.object_id = :object_id
            ORDER BY bm.uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $objectId]);
        $bimModels = $stmt->fetchAll();
        
        // Получаем документы объекта
        $stmt = $db->prepare("
            SELECT * FROM documents
            WHERE object_id = :object_id AND project_id IS NULL
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $objectId]);
        $documents = $stmt->fetchAll();
        
        // Получаем сообщения
        $stmt = $db->prepare("
            SELECT m.*, u.name as user_name, u.email as user_email
            FROM messages m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.object_id = :object_id
            ORDER BY m.created_at DESC
        ");
        $stmt->execute(['object_id' => $objectId]);
        $messages = $stmt->fetchAll();
        
        // Подсчитываем непрочитанные сообщения от заказчика
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM messages
            WHERE object_id = :object_id
            AND is_admin_message = false
            AND is_read_by_admin = false
        ");
        $stmt->execute(['object_id' => $objectId]);
        $unreadMessagesCount = (int)$stmt->fetch()['count'];
        
        // Получаем ID фото и панорам для подсчета комментариев
        $photoIds = array_column($photos, 'id');
        $panoramaIds = array_column($panoramas, 'id');
        
        $unreadPhotoCommentsCount = 0;
        $unreadPanoramaCommentsCount = 0;
        
        if (!empty($photoIds)) {
            $placeholders = implode(',', array_fill(0, count($photoIds), '?'));
            $stmt = $db->prepare("
                SELECT COUNT(*) as count
                FROM photo_comments
                WHERE photo_id IN ($placeholders)
                AND is_admin_comment = false
                AND is_read_by_admin = false
            ");
            $stmt->execute($photoIds);
            $unreadPhotoCommentsCount = (int)$stmt->fetch()['count'];
        }
        
        if (!empty($panoramaIds)) {
            $placeholders = implode(',', array_fill(0, count($panoramaIds), '?'));
            $stmt = $db->prepare("
                SELECT COUNT(*) as count
                FROM panorama_comments
                WHERE panorama_id IN ($placeholders)
                AND is_admin_comment = false
                AND is_read_by_admin = false
            ");
            $stmt->execute($panoramaIds);
            $unreadPanoramaCommentsCount = (int)$stmt->fetch()['count'];
        }
        
        // Для каждого фото формируем URL и подсчитываем непрочитанные комментарии
        $photosWithData = [];
        foreach ($photos as $photo) {
            $stmt = $db->prepare("
                SELECT COUNT(*) as count
                FROM photo_comments
                WHERE photo_id = :photo_id
                AND is_admin_comment = false
                AND is_read_by_admin = false
            ");
            $stmt->execute(['photo_id' => $photo['id']]);
            $unreadComments = (int)$stmt->fetch()['count'];
            
            // Формируем URL
            $uploadedAt = strtotime($photo['uploaded_at']);
            $cacheBuster = $uploadedAt ?: time();
            $baseUrl = $photo['file_path'] ?: "/uploads/objects/{$objectId}/{$photo['filename']}";
            $thumbnailUrl = null;
            
            if ($photo['thumbnail_filename'] || $photo['thumbnail_file_path']) {
                $thumbnailBase = $photo['thumbnail_file_path'] ?: "/uploads/objects/{$objectId}/thumbnails/{$photo['thumbnail_filename']}";
                $thumbnailUrl = "$thumbnailBase?v=$cacheBuster";
            }
            
            $photosWithData[] = [
                'id' => $photo['id'],
                'filename' => $photo['filename'],
                'originalName' => $photo['original_name'],
                'url' => "$baseUrl?v=$cacheBuster",
                'thumbnailUrl' => $thumbnailUrl,
                'uploadedAt' => $photo['uploaded_at'],
                'isVisibleToCustomer' => dbBool($photo['is_visible_to_customer']),
                'folder' => $photo['folder_id'] ? [
                    'id' => $photo['folder_id'],
                    'name' => $photo['folder_name']
                ] : null,
                'unreadCommentsCount' => $unreadComments
            ];
        }
        
        // Для каждой панорамы формируем URL и подсчитываем непрочитанные комментарии
        $panoramasWithData = [];
        foreach ($panoramas as $panorama) {
            $stmt = $db->prepare("
                SELECT COUNT(*) as count
                FROM panorama_comments
                WHERE panorama_id = :panorama_id
                AND is_admin_comment = false
                AND is_read_by_admin = false
            ");
            $stmt->execute(['panorama_id' => $panorama['id']]);
            $unreadComments = (int)$stmt->fetch()['count'];
            
            // Формируем URL
            $uploadedAt = strtotime($panorama['uploaded_at']);
            $cacheBuster = $uploadedAt ?: time();
            $baseUrl = $panorama['file_path'] ?: "/uploads/objects/{$objectId}/panoramas/{$panorama['filename']}";
            $thumbnailUrl = null;
            
            if ($panorama['thumbnail_filename'] || $panorama['thumbnail_file_path']) {
                $thumbnailBase = $panorama['thumbnail_file_path'] ?: "/uploads/objects/{$objectId}/panoramas/thumbnails/{$panorama['thumbnail_filename']}";
                $thumbnailUrl = "$thumbnailBase?v=$cacheBuster";
            }
            
            $panoramasWithData[] = [
                'id' => $panorama['id'],
                'filename' => $panorama['filename'],
                'originalName' => $panorama['original_name'],
                'url' => "$baseUrl?v=$cacheBuster",
                'thumbnailUrl' => $thumbnailUrl,
                'uploadedAt' => $panorama['uploaded_at'],
                'isVisibleToCustomer' => dbBool($panorama['is_visible_to_customer']),
                'unreadCommentsCount' => $unreadComments
            ];
        }
        
        successResponse([
            'object' => [
                'id' => $object['id'],
                'userId' => $object['user_id'],
                'title' => $object['title'],
                'description' => $object['description'],
                'address' => $object['address'],
                'status' => $object['status'],
                'createdAt' => $object['created_at'],
                'updatedAt' => $object['updated_at'],
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['name']
                ],
                'photos' => $photosWithData,
                'panoramas' => $panoramasWithData,
                'projects' => $projects,
                'documents' => $documents,
                'messages' => $messages,
                'bimModels' => $bimModels,
                'unreadMessagesCount' => $unreadMessagesCount,
                'unreadCommentsCount' => $unreadPhotoCommentsCount + $unreadPanoramaCommentsCount,
                'unreadPhotoCommentsCount' => $unreadPhotoCommentsCount,
                'unreadPanoramaCommentsCount' => $unreadPanoramaCommentsCount
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin object-details GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
