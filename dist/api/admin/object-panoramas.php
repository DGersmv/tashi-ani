<?php
/**
 * API endpoint для управления панорамами объекта (админка)
 * PUT /api/admin/object-panoramas.php?objectId=123 - изменить видимость панорамы
 * DELETE /api/admin/object-panoramas.php?objectId=123 - удалить панораму
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

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Доступ запрещен', 403);
        }
        
        $objectId = isset($_GET['objectId']) ? (int)$_GET['objectId'] : 0;
        
        if ($objectId <= 0) {
            errorResponse('Неверный ID объекта', 400);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $panoramaId = isset($input['panoramaId']) ? (int)$input['panoramaId'] : 0;
        $isVisibleToCustomer = isset($input['isVisibleToCustomer']) ? (bool)$input['isVisibleToCustomer'] : false;
        
        if ($panoramaId <= 0) {
            errorResponse('Неверные параметры', 400);
        }
        
        $db = getDbConnection();
        
        // Обновляем видимость панорамы
        $stmt = $db->prepare("
            UPDATE panoramas
            SET is_visible_to_customer = :is_visible, updated_at = NOW()
            WHERE id = :panorama_id AND object_id = :object_id
            RETURNING id, filename, original_name, file_path, thumbnail_filename, thumbnail_file_path, uploaded_at, is_visible_to_customer
        ");
        $stmt->execute([
            'panorama_id' => $panoramaId,
            'object_id' => $objectId,
            'is_visible' => $isVisibleToCustomer ? 'true' : 'false'
        ]);
        $updatedPanorama = $stmt->fetch();
        
        if (!$updatedPanorama) {
            errorResponse('Панорама не найдена', 404);
        }
        
        // Формируем URL
        $uploadedAt = strtotime($updatedPanorama['uploaded_at']);
        $cacheBuster = $uploadedAt ?: time();
        $baseUrl = $updatedPanorama['file_path'] ?: "/uploads/objects/{$objectId}/panoramas/{$updatedPanorama['filename']}";
        $thumbnailUrl = null;
        
        if ($updatedPanorama['thumbnail_filename'] || $updatedPanorama['thumbnail_file_path']) {
            $thumbnailBase = $updatedPanorama['thumbnail_file_path'] ?: "/uploads/objects/{$objectId}/panoramas/thumbnails/{$updatedPanorama['thumbnail_filename']}";
            $thumbnailUrl = "$thumbnailBase?v=$cacheBuster";
        }
        
        successResponse([
            'panorama' => [
                'id' => $updatedPanorama['id'],
                'filename' => $updatedPanorama['filename'],
                'originalName' => $updatedPanorama['original_name'],
                'url' => "$baseUrl?v=$cacheBuster",
                'thumbnailUrl' => $thumbnailUrl,
                'isVisibleToCustomer' => dbBool($updatedPanorama['is_visible_to_customer'])
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin object-panoramas PUT error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Доступ запрещен', 403);
        }
        
        $objectId = isset($_GET['objectId']) ? (int)$_GET['objectId'] : 0;
        
        if ($objectId <= 0) {
            errorResponse('Неверный ID объекта', 400);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $panoramaId = isset($input['panoramaId']) ? (int)$input['panoramaId'] : 0;
        
        if ($panoramaId <= 0) {
            errorResponse('ID панорамы обязателен', 400);
        }
        
        $db = getDbConnection();
        
        // Получаем информацию о панораме
        $stmt = $db->prepare("
            SELECT * FROM panoramas
            WHERE id = :panorama_id AND object_id = :object_id
        ");
        $stmt->execute([
            'panorama_id' => $panoramaId,
            'object_id' => $objectId
        ]);
        $panorama = $stmt->fetch();
        
        if (!$panorama) {
            errorResponse('Панорама не найдена', 404);
        }
        
        // Удаляем файл с диска (если существует)
        if (!empty($panorama['file_path'])) {
            $relativePath = ltrim($panorama['file_path'], '/');
            $filePath = __DIR__ . '/../../public/' . $relativePath;
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        
        // Удаляем thumbnail (если существует)
        if (!empty($panorama['thumbnail_file_path'])) {
            $thumbPath = __DIR__ . '/../../public/' . ltrim($panorama['thumbnail_file_path'], '/');
            if (file_exists($thumbPath)) {
                @unlink($thumbPath);
            }
        }
        
        // Удаляем запись из базы данных
        $stmt = $db->prepare("DELETE FROM panoramas WHERE id = :panorama_id");
        $stmt->execute(['panorama_id' => $panoramaId]);
        
        successResponse(['message' => 'Панорама удалена']);
        
    } catch (Exception $e) {
        error_log("Admin object-panoramas DELETE error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

// Примечание: POST для загрузки панорам будет реализован отдельно, так как требует обработку multipart/form-data

?>
