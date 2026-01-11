<?php
/**
 * API endpoint для отправки кода верификации
 * POST /api/auth/send-code.php
 */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/userManagement.php';
require_once __DIR__ . '/../lib/email.php';

// Поддержка OPTIONS для CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON', 400);
    }
    
    $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
    
    if (empty($email)) {
        errorResponse('Email обязателен', 400);
    }
    
    // Проверяем, является ли это мастер-админом
    if (isMasterAdmin($email)) {
        errorResponse('Для входа мастер-админа используйте пароль', 400);
    }
    
    // Проверяем, существует ли пользователь в базе
    if (!userExists($email)) {
        errorResponse('Свяжитесь с администратором для получения доступа', 403);
    }
    
    // Генерируем 6-значный код
    $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Сохраняем код в базе данных
    $db = getDbConnection();
    
    // Удаляем старые коды для этого email
    $stmt = $db->prepare("DELETE FROM verification_codes WHERE email = :email");
    $stmt->execute(['email' => $email]);
    
    // Вставляем новый код (действителен 10 минут)
    $expiresAt = date('Y-m-d H:i:s', time() + 10 * 60);
    $stmt = $db->prepare("
        INSERT INTO verification_codes (email, code, expires_at, created_at)
        VALUES (:email, :code, :expires_at, NOW())
    ");
    $stmt->execute([
        'email' => $email,
        'code' => $code,
        'expires_at' => $expiresAt
    ]);
    
    // Отправляем код на email
    $subject = 'Код верификации для входа в Tashi Ani';
    $htmlMessage = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .code-box { background: white; padding: 20px; margin: 20px 0; border: 2px solid #4CAF50; border-radius: 8px; text-align: center; }
            .code { font-family: monospace; font-size: 32px; font-weight: bold; color: #2E7D32; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔐 Код верификации</h1>
            </div>
            <div class='content'>
                <p>Здравствуйте!</p>
                <p>Вы запросили код для входа в систему <strong>Tashi Ani</strong>.</p>
                
                <div class='code-box'>
                    <p style='margin-top: 0; font-weight: bold; color: #2E7D32;'>Ваш код верификации:</p>
                    <p class='code'>{$code}</p>
                </div>
                
                <p><strong>Важно:</strong> Код действителен в течение 10 минут. Не передавайте его никому.</p>
                
                <p>Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
            </div>
            <div class='footer'>
                <p>С уважением,<br>Команда Tashi Ani</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $emailSent = sendEmail($email, $subject, $htmlMessage);
    
    if (!$emailSent) {
        error_log("Failed to send verification code email to $email");
        // Не возвращаем ошибку пользователю, чтобы не раскрывать что email не отправлен
    }
    
    successResponse([
        'message' => 'Код отправлен на email'
    ]);
    
} catch (Exception $e) {
    error_log("Send code error: " . $e->getMessage());
    errorResponse('Внутренняя ошибка сервера', 500);
}

?>
