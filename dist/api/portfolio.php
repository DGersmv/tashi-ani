<?php
/**
 * API endpoint для получения портфолио
 * GET /api/portfolio.php
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    $portfolioDir = __DIR__ . '/../public/portfolio';
    
    if (!is_dir($portfolioDir)) {
        successResponse(['items' => []]);
    }
    
    $files = scandir($portfolioDir);
    $items = [];
    
    foreach ($files as $file) {
        // Пропускаем скрытые файлы и директории
        if ($file[0] === '.') {
            continue;
        }
        
        // Проверяем расширение файла
        if (!preg_match('/\.(png|jpe?g|webp|gif|avif|mp4|webm|mov)$/i', $file)) {
            continue;
        }
        
        $isVideo = preg_match('/\.(mp4|webm|mov)$/i', $file);
        
        $items[] = [
            'file' => "/portfolio/{$file}",
            'type' => $isVideo ? 'video' : 'image',
            'captionRu' => $file,
            'captionEn' => $file
        ];
    }
    
    successResponse(['items' => $items]);
    
} catch (Exception $e) {
    error_log("Portfolio GET error: " . $e->getMessage());
    successResponse(['items' => []]); // Возвращаем пустой массив при ошибке
}

?>
