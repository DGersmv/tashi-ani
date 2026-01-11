<?php
/**
 * API endpoint для получения детальной информации об объекте
 * GET /api/user/object-details.php?id=123&email=user@example.com
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
    $objectId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    
    if ($objectId <= 0) {
        errorResponse('ID объекта обязателен', 400);
    }
    
    if (empty($email)) {
        errorResponse('Email обязателен', 400);
    }
    
    $db = getDbConnection();
    
    // Найти объект с проверкой принадлежности пользователю
    $stmt = $db->prepare("
        SELECT o.*, u.id as user_id, u.email as user_email
        FROM objects o
        INNER JOIN users u ON o.user_id = u.id
        WHERE o.id = :object_id AND u.email = :email AND o.status = 'ACTIVE'
    ");
    $stmt->execute([
        'object_id' => $objectId,
        'email' => $email
    ]);
    $object = $stmt->fetch();
    
    if (!$object) {
        errorResponse('Объект не найден', 404);
    }
    
    // Получаем фото
    $stmt = $db->prepare("
        SELECT p.*, pf.id as folder_id, pf.name as folder_name
        FROM photos p
        LEFT JOIN photo_folders pf ON p.folder_id = pf.id
        WHERE p.object_id = :object_id AND p.is_visible_to_customer = true
        ORDER BY p.uploaded_at DESC
    ");
    $stmt->execute(['object_id' => $objectId]);
    $photos = $stmt->fetchAll();
    
    // Получаем панорамы
    $stmt = $db->prepare("
        SELECT * FROM panoramas
        WHERE object_id = :object_id AND is_visible_to_customer = true
        ORDER BY uploaded_at DESC
    ");
    $stmt->execute(['object_id' => $objectId]);
    $panoramas = $stmt->fetchAll();
    
    // Получаем проекты с документами и этапами
    $stmt = $db->prepare("
        SELECT * FROM projects
        WHERE object_id = :object_id
        ORDER BY created_at DESC
    ");
    $stmt->execute(['object_id' => $objectId]);
    $projects = $stmt->fetchAll();
    
    // Для каждого проекта получаем документы
    $projectsWithData = [];
    foreach ($projects as $project) {
        $stmt = $db->prepare("
            SELECT * FROM documents
            WHERE project_id = :project_id
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute(['project_id' => $project['id']]);
        $documents = $stmt->fetchAll();
        
        $stmt = $db->prepare("
            SELECT ps.*, COUNT(p.id) as photos_count
            FROM project_stages ps
            LEFT JOIN photos p ON p.project_stage_id = ps.id AND p.is_visible_to_customer = true
            WHERE ps.project_id = :project_id
            GROUP BY ps.id
            ORDER BY ps.order_index ASC
        ");
        $stmt->execute(['project_id' => $project['id']]);
        $stages = $stmt->fetchAll();
        
        // Для каждого этапа получаем фото
        foreach ($stages as &$stage) {
            $stmt = $db->prepare("
                SELECT * FROM photos
                WHERE project_stage_id = :stage_id AND is_visible_to_customer = true
                ORDER BY uploaded_at ASC
            ");
            $stmt->execute(['stage_id' => $stage['id']]);
            $stagePhotos = $stmt->fetchAll();
            $stage['photos'] = $stagePhotos;
        }
        
        $projectsWithData[] = [
            'id' => $project['id'],
            'title' => $project['title'],
            'description' => $project['description'],
            'status' => $project['status'],
            'createdAt' => $project['created_at'],
            'updatedAt' => $project['updated_at'],
            'documents' => $documents,
            'stages' => $stages,
            '_count' => [
                'photos' => (int)$project['photos_count'] ?? 0,
                'documents' => count($documents),
                'messages' => 0 // TODO: подсчитать если нужно
            ]
        ];
    }
    
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
    
    // Подсчитываем непрочитанные сообщения
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM messages
        WHERE object_id = :object_id
        AND is_admin_message = true
        AND is_read_by_customer = false
    ");
    $stmt->execute(['object_id' => $objectId]);
    $unreadMessagesCount = (int)$stmt->fetch()['count'];
    
    // Получаем ID фото и панорам для подсчета комментариев
    $photoIds = array_column($photos, 'id');
    $panoramaIds = array_column($panoramas, 'id');
    
    $unreadPhotoCommentsCount = 0;
    $unreadPanoramaCommentsCount = 0;
    $totalPhotoCommentsCount = 0;
    $totalPanoramaCommentsCount = 0;
    
    if (!empty($photoIds)) {
        $placeholders = implode(',', array_fill(0, count($photoIds), '?'));
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM photo_comments
            WHERE photo_id IN ($placeholders)
            AND is_admin_comment = true
            AND is_read_by_customer = false
        ");
        $stmt->execute($photoIds);
        $unreadPhotoCommentsCount = (int)$stmt->fetch()['count'];
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM photo_comments WHERE photo_id IN ($placeholders)");
        $stmt->execute($photoIds);
        $totalPhotoCommentsCount = (int)$stmt->fetch()['count'];
    }
    
    if (!empty($panoramaIds)) {
        $placeholders = implode(',', array_fill(0, count($panoramaIds), '?'));
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM panorama_comments
            WHERE panorama_id IN ($placeholders)
            AND is_admin_comment = true
            AND is_read_by_customer = false
        ");
        $stmt->execute($panoramaIds);
        $unreadPanoramaCommentsCount = (int)$stmt->fetch()['count'];
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM panorama_comments WHERE panorama_id IN ($placeholders)");
        $stmt->execute($panoramaIds);
        $totalPanoramaCommentsCount = (int)$stmt->fetch()['count'];
    }
    
    // Для каждого фото подсчитываем непрочитанные комментарии и формируем URL
    $photosWithData = [];
    foreach ($photos as $photo) {
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM photo_comments
            WHERE photo_id = :photo_id
            AND is_admin_comment = true
            AND is_read_by_customer = false
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
            'folder' => $photo['folder_id'] ? [
                'id' => $photo['folder_id'],
                'name' => $photo['folder_name']
            ] : null,
            'unreadCommentsCount' => $unreadComments
        ];
    }
    
    // Для каждой панорамы формируем URL
    $panoramasWithData = [];
    foreach ($panoramas as $panorama) {
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM panorama_comments
            WHERE panorama_id = :panorama_id
            AND is_admin_comment = true
            AND is_read_by_customer = false
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
            'unreadCommentsCount' => $unreadComments
        ];
    }
    
    // Подсчитываем общее количество сообщений
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM messages WHERE object_id = :object_id");
    $stmt->execute(['object_id' => $objectId]);
    $totalMessagesCount = (int)$stmt->fetch()['count'];
    
    successResponse([
        'object' => [
            'id' => $object['id'],
            'title' => $object['title'],
            'description' => $object['description'],
            'address' => $object['address'],
            'status' => $object['status'],
            'createdAt' => $object['created_at'],
            'updatedAt' => $object['updated_at'],
            'photos' => $photosWithData,
            'panoramas' => $panoramasWithData,
            'projects' => $projectsWithData,
            'documents' => $documents,
            'messages' => $messages,
            'bimModels' => $bimModels,
            'unreadMessagesCount' => $unreadMessagesCount,
            'unreadCommentsCount' => $unreadPhotoCommentsCount + $unreadPanoramaCommentsCount,
            'unreadPhotoCommentsCount' => $unreadPhotoCommentsCount,
            'unreadPanoramaCommentsCount' => $unreadPanoramaCommentsCount,
            'totalMessagesCount' => $totalMessagesCount,
            'totalCommentsCount' => $totalPhotoCommentsCount + $totalPanoramaCommentsCount,
            'totalPhotoCommentsCount' => $totalPhotoCommentsCount,
            'totalPanoramaCommentsCount' => $totalPanoramaCommentsCount
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Object details error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
