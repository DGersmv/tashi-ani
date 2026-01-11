<?php
/**
 * API endpoint для управления объектами (админка)
 * GET /api/admin/objects.php?userId=123 - получить объекты пользователя
 * POST /api/admin/objects.php - создать объект
 * DELETE /api/admin/objects.php?id=123 - удалить объект
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
            errorResponse('Неавторизованный доступ', 401);
        }
        
        $userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;
        
        if ($userId <= 0) {
            errorResponse('ID пользователя обязателен', 400);
        }
        
        $db = getDbConnection();
        
        // Получаем объекты пользователя
        $stmt = $db->prepare("
            SELECT o.*,
                COUNT(DISTINCT pr.id) as projects_count,
                COUNT(DISTINCT p.id) as photos_count,
                COUNT(DISTINCT d.id) as documents_count,
                COUNT(DISTINCT m.id) as messages_count
            FROM objects o
            LEFT JOIN projects pr ON pr.object_id = o.id
            LEFT JOIN photos p ON p.object_id = o.id
            LEFT JOIN documents d ON d.object_id = o.id
            LEFT JOIN messages m ON m.object_id = o.id
            WHERE o.user_id = :user_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        $objects = $stmt->fetchAll();
        
        // Получаем детальную информацию для каждого объекта
        $objectsWithStats = [];
        foreach ($objects as $obj) {
            // Получаем проекты
            $stmt = $db->prepare("SELECT * FROM projects WHERE object_id = :object_id");
            $stmt->execute(['object_id' => $obj['id']]);
            $projects = $stmt->fetchAll();
            
            // Получаем фото
            $stmt = $db->prepare("SELECT id FROM photos WHERE object_id = :object_id");
            $stmt->execute(['object_id' => $obj['id']]);
            $photos = $stmt->fetchAll();
            
            // Получаем документы
            $stmt = $db->prepare("SELECT * FROM documents WHERE object_id = :object_id");
            $stmt->execute(['object_id' => $obj['id']]);
            $documents = $stmt->fetchAll();
            
            // Получаем сообщения
            $stmt = $db->prepare("SELECT * FROM messages WHERE object_id = :object_id");
            $stmt->execute(['object_id' => $obj['id']]);
            $messages = $stmt->fetchAll();
            
            $objectsWithStats[] = [
                'id' => $obj['id'],
                'userId' => $obj['user_id'],
                'title' => $obj['title'],
                'description' => $obj['description'],
                'address' => $obj['address'],
                'status' => $obj['status'],
                'createdAt' => $obj['created_at'],
                'updatedAt' => $obj['updated_at'],
                'projects' => $projects,
                'photos' => array_column($photos, 'id'),
                'documents' => $documents,
                'messages' => $messages,
                'projectsCount' => count($projects),
                'photosCount' => count($photos),
                'documentsCount' => count($documents),
                'messagesCount' => count($messages)
            ];
        }
        
        successResponse(['objects' => $objectsWithStats]);
        
    } catch (Exception $e) {
        error_log("Admin objects GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Неавторизованный доступ', 401);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $userId = isset($input['userId']) ? (int)$input['userId'] : 0;
        $title = isset($input['title']) ? trim($input['title']) : '';
        $description = isset($input['description']) ? trim($input['description']) : null;
        $address = isset($input['address']) ? trim($input['address']) : null;
        
        if ($userId <= 0 || empty($title)) {
            errorResponse('ID пользователя и название объекта обязательны', 400);
        }
        
        // Проверяем, существует ли пользователь
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        
        if (!$stmt->fetch()) {
            errorResponse('Пользователь не найден', 404);
        }
        
        // Создаем объект
        $stmt = $db->prepare("
            INSERT INTO objects (user_id, title, description, address, status, created_at, updated_at)
            VALUES (:user_id, :title, :description, :address, 'ACTIVE', NOW(), NOW())
            RETURNING id, user_id, title, description, address, status, created_at, updated_at
        ");
        $stmt->execute([
            'user_id' => $userId,
            'title' => $title,
            'description' => $description,
            'address' => $address
        ]);
        $object = $stmt->fetch();
        
        successResponse([
            'object' => [
                'id' => $object['id'],
                'userId' => $object['user_id'],
                'title' => $object['title'],
                'description' => $object['description'],
                'address' => $object['address'],
                'status' => $object['status'],
                'createdAt' => $object['created_at'],
                'updatedAt' => $object['updated_at']
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin objects POST error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Неавторизованный доступ', 401);
        }
        
        $objectId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($objectId <= 0) {
            errorResponse('ID объекта обязателен', 400);
        }
        
        $db = getDbConnection();
        $stmt = $db->prepare("DELETE FROM objects WHERE id = :object_id");
        $stmt->execute(['object_id' => $objectId]);
        
        successResponse(['message' => 'Объект успешно удален']);
        
    } catch (Exception $e) {
        error_log("Admin objects DELETE error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
