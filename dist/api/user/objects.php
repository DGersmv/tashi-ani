<?php
/**
 * API endpoint для получения объектов пользователя
 * GET /api/user/objects.php?email=user@example.com
 */

require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
    
    if (empty($email)) {
        errorResponse('Email обязателен', 400);
    }
    
    $db = getDbConnection();
    
    // Найти пользователя с его объектами
    $stmt = $db->prepare("
        SELECT id, email, name, role, status 
        FROM users 
        WHERE email = :email
    ");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Пользователь не найден', 404);
    }
    
    // Получаем объекты пользователя
    $stmt = $db->prepare("
        SELECT o.*, 
               COUNT(DISTINCT p.id) as photos_count,
               COUNT(DISTINCT pan.id) as panoramas_count,
               COUNT(DISTINCT d.id) as documents_count,
               COUNT(DISTINCT m.id) as messages_count
        FROM objects o
        LEFT JOIN photos p ON p.object_id = o.id AND p.is_visible_to_customer = true
        LEFT JOIN panoramas pan ON pan.object_id = o.id AND pan.is_visible_to_customer = true
        LEFT JOIN documents d ON d.object_id = o.id
        LEFT JOIN messages m ON m.object_id = o.id
        WHERE o.user_id = :user_id AND o.status = 'ACTIVE'
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ");
    $stmt->execute(['user_id' => $user['id']]);
    $objects = $stmt->fetchAll();
    
    // Для каждого объекта получаем детальную информацию
    $objectsWithStats = [];
    foreach ($objects as $obj) {
        // Получаем непрочитанные сообщения
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM messages 
            WHERE object_id = :object_id 
            AND is_admin_message = true 
            AND is_read_by_customer = false
        ");
        $stmt->execute(['object_id' => $obj['id']]);
        $unreadMessages = $stmt->fetch()['count'];
        
        // Получаем ID фото и панорам для подсчета комментариев
        $stmt = $db->prepare("SELECT id FROM photos WHERE object_id = :object_id AND is_visible_to_customer = true");
        $stmt->execute(['object_id' => $obj['id']]);
        $photoIds = array_column($stmt->fetchAll(), 'id');
        
        $stmt = $db->prepare("SELECT id FROM panoramas WHERE object_id = :object_id AND is_visible_to_customer = true");
        $stmt->execute(['object_id' => $obj['id']]);
        $panoramaIds = array_column($stmt->fetchAll(), 'id');
        
        // Подсчитываем непрочитанные комментарии
        $unreadPhotoComments = 0;
        $unreadPanoramaComments = 0;
        $totalPhotoComments = 0;
        $totalPanoramaComments = 0;
        
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
            $unreadPhotoComments = $stmt->fetch()['count'];
            
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM photo_comments WHERE photo_id IN ($placeholders)");
            $stmt->execute($photoIds);
            $totalPhotoComments = $stmt->fetch()['count'];
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
            $unreadPanoramaComments = $stmt->fetch()['count'];
            
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM panorama_comments WHERE panorama_id IN ($placeholders)");
            $stmt->execute($panoramaIds);
            $totalPanoramaComments = $stmt->fetch()['count'];
        }
        
        // Получаем фото и панорамы с URL
        $stmt = $db->prepare("
            SELECT id, filename, original_name, file_path, thumbnail_filename, thumbnail_file_path, uploaded_at
            FROM photos 
            WHERE object_id = :object_id AND is_visible_to_customer = true
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $obj['id']]);
        $photos = $stmt->fetchAll();
        
        $photosWithUrls = array_map(function($photo) use ($obj) {
            $uploadedAt = strtotime($photo['uploaded_at']);
            $cacheBuster = $uploadedAt ?: time();
            $baseUrl = $photo['file_path'] ?: "/uploads/objects/{$obj['id']}/{$photo['filename']}";
            $thumbnailUrl = null;
            
            if ($photo['thumbnail_filename'] || $photo['thumbnail_file_path']) {
                $thumbnailBase = $photo['thumbnail_file_path'] ?: "/uploads/objects/{$obj['id']}/thumbnails/{$photo['thumbnail_filename']}";
                $thumbnailUrl = "$thumbnailBase?v=$cacheBuster";
            }
            
            return [
                'id' => $photo['id'],
                'filename' => $photo['filename'],
                'originalName' => $photo['original_name'],
                'url' => "$baseUrl?v=$cacheBuster",
                'thumbnailUrl' => $thumbnailUrl,
                'uploadedAt' => $photo['uploaded_at']
            ];
        }, $photos);
        
        $stmt = $db->prepare("
            SELECT id, filename, original_name, file_path, thumbnail_filename, thumbnail_file_path, uploaded_at
            FROM panoramas 
            WHERE object_id = :object_id AND is_visible_to_customer = true
            ORDER BY uploaded_at DESC
        ");
        $stmt->execute(['object_id' => $obj['id']]);
        $panoramas = $stmt->fetchAll();
        
        $panoramasWithUrls = array_map(function($panorama) use ($obj) {
            $uploadedAt = strtotime($panorama['uploaded_at']);
            $cacheBuster = $uploadedAt ?: time();
            $baseUrl = $panorama['file_path'] ?: "/uploads/objects/{$obj['id']}/panoramas/{$panorama['filename']}";
            $thumbnailUrl = null;
            
            if ($panorama['thumbnail_filename'] || $panorama['thumbnail_file_path']) {
                $thumbnailBase = $panorama['thumbnail_file_path'] ?: "/uploads/objects/{$obj['id']}/panoramas/thumbnails/{$panorama['thumbnail_filename']}";
                $thumbnailUrl = "$thumbnailBase?v=$cacheBuster";
            }
            
            return [
                'id' => $panorama['id'],
                'filename' => $panorama['filename'],
                'originalName' => $panorama['original_name'],
                'url' => "$baseUrl?v=$cacheBuster",
                'thumbnailUrl' => $thumbnailUrl,
                'uploadedAt' => $panorama['uploaded_at']
            ];
        }, $panoramas);
        
        // Получаем проекты
        $stmt = $db->prepare("
            SELECT id, title, description, status, created_at
            FROM projects 
            WHERE object_id = :object_id
            ORDER BY created_at DESC
        ");
        $stmt->execute(['object_id' => $obj['id']]);
        $projects = $stmt->fetchAll();
        
        $objectsWithStats[] = [
            'id' => $obj['id'],
            'title' => $obj['title'],
            'description' => $obj['description'],
            'address' => $obj['address'],
            'status' => $obj['status'],
            'createdAt' => $obj['created_at'],
            'updatedAt' => $obj['updated_at'],
            'photos' => $photosWithUrls,
            'panoramas' => $panoramasWithUrls,
            'projects' => $projects,
            'unreadMessagesCount' => (int)$unreadMessages,
            'unreadCommentsCount' => (int)($unreadPhotoComments + $unreadPanoramaComments),
            'unreadPhotoCommentsCount' => (int)$unreadPhotoComments,
            'unreadPanoramaCommentsCount' => (int)$unreadPanoramaComments,
            'totalMessagesCount' => (int)$obj['messages_count'],
            'totalCommentsCount' => (int)($totalPhotoComments + $totalPanoramaComments),
            'totalPhotoCommentsCount' => (int)$totalPhotoComments,
            'totalPanoramaCommentsCount' => (int)$totalPanoramaComments,
            '_count' => [
                'documents' => (int)$obj['documents_count']
            ]
        ];
    }
    
    successResponse([
        'objects' => $objectsWithStats
    ]);
    
} catch (Exception $e) {
    error_log("User objects error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
