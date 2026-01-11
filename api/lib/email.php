<?php
/**
 * Функции для отправки email
 * Аналог nodemailer для PHP
 */

/**
 * Отправка email через SMTP
 */
function sendEmailViaSMTP($host, $port, $username, $password, $fromEmail, $fromName, $secure, $toEmail, $subject, $htmlMessage) {
    try {
        $boundary = uniqid('boundary');
        
        // Формируем тело письма
        $body = "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        $body .= $htmlMessage . "\r\n";
        $body .= "--{$boundary}--\r\n";
        
        // Создаем соединение с SMTP сервером
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        
        $socket = stream_socket_client(
            ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port,
            $errno,
            $errstr,
            30,
            STREAM_CLIENT_CONNECT,
            $context
        );
        
        if (!$socket) {
            error_log("SMTP Connection failed: $errstr ($errno)");
            return false;
        }
        
        // Читаем приветствие сервера
        fgets($socket, 515);
        
        // EHLO
        fputs($socket, "EHLO " . $host . "\r\n");
        $response = fgets($socket, 515);
        while ($response && substr($response, 3, 1) == '-') {
            $response = fgets($socket, 515);
        }
        
        // STARTTLS для порта 587
        if ($secure === 'tls' && $port == 587) {
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 515);
            if (substr($response, 0, 3) != '220') {
                fclose($socket);
                return false;
            }
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($socket, "EHLO " . $host . "\r\n");
            $response = fgets($socket, 515);
            while ($response && substr($response, 3, 1) == '-') {
                $response = fgets($socket, 515);
            }
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            return false;
        }
        
        fputs($socket, base64_encode($username) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            return false;
        }
        
        fputs($socket, base64_encode($password) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '235') {
            fclose($socket);
            error_log("SMTP Authentication failed: $response");
            return false;
        }
        
        // MAIL FROM
        fputs($socket, "MAIL FROM: <{$fromEmail}>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return false;
        }
        
        // RCPT TO
        fputs($socket, "RCPT TO: <{$toEmail}>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return false;
        }
        
        // DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '354') {
            fclose($socket);
            return false;
        }
        
        // Заголовки письма
        $emailHeaders = "From: {$fromName} <{$fromEmail}>\r\n";
        $emailHeaders .= "To: {$toEmail}\r\n";
        $emailHeaders .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $emailHeaders .= "MIME-Version: 1.0\r\n";
        $emailHeaders .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
        $emailHeaders .= "Content-Transfer-Encoding: 7bit\r\n";
        
        fputs($socket, $emailHeaders . "\r\n");
        fputs($socket, $body . "\r\n");
        fputs($socket, ".\r\n");
        
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            error_log("SMTP Send failed: $response");
            return false;
        }
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return true;
    } catch (Exception $e) {
        error_log("SMTP Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Отправка email (обертка)
 */
function sendEmail($toEmail, $subject, $htmlMessage) {
    // Получаем настройки из config.php
    $smtpHost = defined('EMAIL_HOST') ? EMAIL_HOST : '';
    $smtpPort = defined('EMAIL_PORT') ? EMAIL_PORT : 465;
    $smtpUser = defined('EMAIL_USER') ? EMAIL_USER : '';
    $smtpPass = defined('EMAIL_PASS') ? EMAIL_PASS : '';
    $smtpFromEmail = defined('EMAIL_FROM') ? EMAIL_FROM : '';
    $smtpFromName = defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : 'Tashi Ani';
    $smtpSecure = defined('EMAIL_SECURE') ? EMAIL_SECURE : 'ssl';
    
    if (empty($smtpHost) || empty($smtpUser) || empty($smtpPass)) {
        error_log("Email configuration not found, using mail() function");
        // Используем стандартную функцию mail()
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$smtpFromName} <{$smtpFromEmail}>\r\n";
        return @mail($toEmail, $subject, $htmlMessage, $headers);
    }
    
    // Определяем secure на основе порта
    if ($smtpPort == 587) {
        $smtpSecure = 'tls';
    } elseif ($smtpPort == 465) {
        $smtpSecure = 'ssl';
    }
    
    return sendEmailViaSMTP(
        $smtpHost,
        $smtpPort,
        $smtpUser,
        $smtpPass,
        $smtpFromEmail,
        $smtpFromName,
        $smtpSecure,
        $toEmail,
        $subject,
        $htmlMessage
    );
}

?>
