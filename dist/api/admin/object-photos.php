<?php
/**
 * API endpoint для управления фото объекта (админка)
 * POST /api/admin/object-photos.php?objectId=123 - загрузить фото
 * PUT /api/admin/object-photos.php?objectId=123 - изменить видимость фото
 * DELETE /api/admin/object-photos.php?objectId=123 - удалить фото
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
        
        $photoId = isset($input['photoId']) ? (int)$input['photoId'] : 0;
        $isVisibleToCustomer = isset($input['isVisibleToCustomer']) ? (bool)$input['isVisibleToCustomer'] : false;
        
        if ($photoId <= 0) {
            errorResponse('Неверные параметры', 400);
        }
        
        $db = getDbConnection();
        
        // Обновляем видимость фото
        $stmt = $db->prepare("
            UPDATE photos
            SET is_visible_to_customer = :is_visible, updated_at = NOW()
            WHERE id = :photo_id AND object_id = :object_id
            RETURNING id, filename, original_name, file_path, thumbnail_filename, thumbnail_file_path, uploaded_at, is_visible_to_customer
        ");
        $stmt->execute([
            'photo_id' => $photoId,
            'object_id' => $objectId,
            'is_visible' => $isVisibleToCustomer ? 'true' : 'false'
        ]);
        $updatedPhoto = $stmt->fetch();
        
        if (!$updatedPhoto) {
            errorResponse('Фото не найдено', 404);
        }
        
        // Формируем URL
        $uploadedAt = strtotime($updatedPhoto['uploaded_at']);
        $cacheBuster = $uploadedAt ?: time();
        $baseUrl = $updatedPhoto['file_path'] ?: "/uploads/objects/{$objectId}/{$updatedPhoto['filename']}";
        $thumbnailUrl = null;
        
        if ($updatedPhoto['thumbnail_filename'] || $updatedPhoto['thumbnail_file_path']) {
            $thumbnailBase = $updatedPhoto['thumbnail_file_path'] ?: "/uploads/objects/{$objectId}/thumbnails/{$updatedPhoto['thumbnail_filename']}";
            $thumbnailUrl = "$thumbnailBase?v=$cacheBuster";
        }
        
        successResponse([
            'photo' => [
                'id' => $updatedPhoto['id'],
                'filename' => $updatedPhoto['filename'],
                'originalName' => $updatedPhoto['original_name'],
                'url' => "$baseUrl?v=$cacheBuster",
                'thumbnailUrl' => $thumbnailUrl,
                'isVisibleToCustomer' => dbBool($updatedPhoto['is_visible_to_customer'])
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin object-photos PUT error: " . $e->getMessage());
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
        
        $photoId = isset($input['photoId']) ? (int)$input['photoId'] : 0;
        
        if ($photoId <= 0) {
            errorResponse('ID фото обязателен', 400);
        }
        
        $db = getDbConnection();
        
        // Получаем информацию о фото
        $stmt = $db->prepare("
            SELECT * FROM photos
            WHERE id = :photo_id AND object_id = :object_id
        ");
        $stmt->execute([
            'photo_id' => $photoId,
            'object_id' => $objectId
        ]);
        $photo = $stmt->fetch();
        
        if (!$photo) {
            errorResponse('Фото не найдено', 404);
        }
        
        // Удаляем файл с диска (если существует)
        if (!empty($photo['file_path'])) {
            $relativePath = ltrim($photo['file_path'], '/');
            $filePath = __DIR__ . '/../../public/' . $relativePath;
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        
        // Удаляем thumbnail (если существует)
        if (!empty($photo['thumbnail_file_path'])) {
            $thumbPath = __DIR__ . '/../../public/' . ltrim($photo['thumbnail_file_path'], '/');
            if (file_exists($thumbPath)) {
                @unlink($thumbPath);
            }
        }
        
        // Удаляем запись из базы данных
        $stmt = $db->prepare("DELETE FROM photos WHERE id = :photo_id");
        $stmt->execute(['photo_id' => $photoId]);
        
        successResponse(['message' => 'Фото удалено']);
        
    } catch (Exception $e) {
        error_log("Admin object-photos DELETE error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

// Примечание: POST для загрузки фото будет реализован отдельно, так как требует обработку multipart/form-data
// Это можно сделать через отдельный endpoint или использовать готовое решение для загрузки файлов

?>
