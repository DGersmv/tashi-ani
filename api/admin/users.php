<?php
/**
 * API endpoint для управления пользователями (админка)
 * GET /api/admin/users.php - получить список пользователей
 * POST /api/admin/users.php - создать пользователя
 * DELETE /api/admin/users.php?id=123 - удалить пользователя
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
            errorResponse('Недостаточно прав для просмотра пользователей', 403);
        }
        
        $db = getDbConnection();
        
        // Получаем всех пользователей с их объектами
        $stmt = $db->prepare("
            SELECT 
                u.*,
                COUNT(DISTINCT o.id) as objects_count,
                COUNT(DISTINCT p.id) as photos_count,
                COUNT(DISTINCT d.id) as documents_count,
                COUNT(DISTINCT pr.id) as projects_count,
                COUNT(DISTINCT m.id) as messages_count
            FROM users u
            LEFT JOIN objects o ON o.user_id = u.id
            LEFT JOIN photos p ON p.object_id = o.id
            LEFT JOIN documents d ON d.object_id = o.id
            LEFT JOIN projects pr ON pr.object_id = o.id
            LEFT JOIN messages m ON m.object_id = o.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ");
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        // Для каждого пользователя получаем объекты
        $usersWithObjects = [];
        foreach ($users as $user) {
            $stmt = $db->prepare("
                SELECT o.*,
                    COUNT(DISTINCT p.id) as photos_count,
                    COUNT(DISTINCT d.id) as documents_count,
                    COUNT(DISTINCT pr.id) as projects_count,
                    COUNT(DISTINCT m.id) as messages_count
                FROM objects o
                LEFT JOIN photos p ON p.object_id = o.id
                LEFT JOIN documents d ON d.object_id = o.id
                LEFT JOIN projects pr ON pr.object_id = o.id
                LEFT JOIN messages m ON m.object_id = o.id
                WHERE o.user_id = :user_id
                GROUP BY o.id
            ");
            $stmt->execute(['user_id' => $user['id']]);
            $objects = $stmt->fetchAll();
            
            $usersWithObjects[] = [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'status' => $user['status'],
                'createdAt' => $user['created_at'],
                'lastLogin' => $user['last_login'],
                'objects' => $objects,
                '_count' => [
                    'photos' => (int)$user['photos_count'],
                    'documents' => (int)$user['documents_count'],
                    'projects' => (int)$user['projects_count'],
                    'messages' => (int)$user['messages_count']
                ]
            ];
        }
        
        successResponse(['users' => $usersWithObjects]);
        
    } catch (Exception $e) {
        error_log("Admin users GET error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Недостаточно прав для добавления пользователей', 403);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            errorResponse('Invalid JSON', 400);
        }
        
        $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
        $name = isset($input['name']) ? trim($input['name']) : null;
        $password = isset($input['password']) ? $input['password'] : '';
        $role = isset($input['role']) ? $input['role'] : 'USER';
        
        if (empty($email)) {
            errorResponse('Email обязателен', 400);
        }
        
        if (empty($password)) {
            errorResponse('Пароль обязателен', 400);
        }
        
        if (strlen($password) < 6) {
            errorResponse('Пароль должен содержать минимум 6 символов', 400);
        }
        
        // Проверяем, существует ли пользователь
        $db = getDbConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        
        if ($stmt->fetch()) {
            errorResponse('Пользователь с таким email уже существует', 409);
        }
        
        // Хешируем пароль
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        // Создаем пользователя
        $stmt = $db->prepare("
            INSERT INTO users (email, name, password, role, status, created_at, updated_at)
            VALUES (:email, :name, :password, :role, 'ACTIVE', NOW(), NOW())
            RETURNING id, email, name, role, status, created_at
        ");
        $stmt->execute([
            'email' => $email,
            'name' => $name,
            'password' => $hashedPassword,
            'role' => $role
        ]);
        $newUser = $stmt->fetch();
        
        successResponse([
            'user' => [
                'id' => $newUser['id'],
                'email' => $newUser['email'],
                'name' => $newUser['name'],
                'role' => $newUser['role'],
                'status' => $newUser['status'],
                'createdAt' => $newUser['created_at']
            ],
            'message' => 'Пользователь успешно добавлен'
        ]);
        
    } catch (Exception $e) {
        error_log("Admin users POST error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $admin = authenticateAdmin();
        if (!$admin) {
            errorResponse('Недостаточно прав для удаления пользователей', 403);
        }
        
        $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($userId <= 0) {
            errorResponse('ID пользователя обязателен', 400);
        }
        
        $db = getDbConnection();
        $stmt = $db->prepare("DELETE FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        
        successResponse(['message' => 'Пользователь успешно удален']);
        
    } catch (Exception $e) {
        error_log("Admin users DELETE error: " . $e->getMessage());
        errorResponse('Внутренняя ошибка сервера', 500);
    }
    
} else {
    errorResponse('Method not allowed', 405);
}

?>
