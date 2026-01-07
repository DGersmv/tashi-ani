# PowerShell скрипт для подготовки чистого архива проекта
# Использование: .\clean-server.ps1

Write-Host "🧹 Подготовка чистого архива проекта..." -ForegroundColor Cyan

# Проверка, что мы в правильной директории
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Ошибка: package.json не найден. Запустите скрипт из корневой директории проекта." -ForegroundColor Red
    exit 1
}

# Директория проекта
$projectRoot = Get-Location

# Проверка на подозрительные файлы
Write-Host "`n🔍 Проверка на подозрительные файлы..." -ForegroundColor Yellow

$suspiciousFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match "(boatnet|yamaha|broncano|miner|\.x86_64)" -or
    $_.Extension -match "\.(sh|bat|exe|bin)$" -and
    $_.FullName -notmatch "(node_modules|\.git|\.next)"
}

if ($suspiciousFiles) {
    Write-Host "⚠️  Найдены подозрительные файлы:" -ForegroundColor Yellow
    $suspiciousFiles | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Yellow }
    Write-Host "`nРекомендуется проверить эти файлы перед созданием архива!" -ForegroundColor Yellow
    $continue = Read-Host "Продолжить создание архива? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✅ Подозрительные файлы не найдены" -ForegroundColor Green
}

# Очистка предыдущих архивов
Write-Host "`n🧹 Очистка предыдущих архивов..." -ForegroundColor Cyan
Remove-Item -Path "tashi-ani-clean.zip" -ErrorAction SilentlyContinue
Remove-Item -Path "tashi-ani-clean.tar.gz" -ErrorAction SilentlyContinue

# Список файлов и директорий для включения
Write-Host "`n📦 Создание архива..." -ForegroundColor Cyan

$filesToInclude = @(
    "src",
    "public",
    "prisma/schema.prisma",
    "prisma/migrations",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "tsconfig.json",
    "ecosystem.config.js",
    "README.md"
)

# Проверка существования файлов
$missingFiles = @()
foreach ($item in $filesToInclude) {
    if (-not (Test-Path $item)) {
        $missingFiles += $item
    }
}

if ($missingFiles) {
    Write-Host "⚠️  Предупреждение: следующие файлы не найдены:" -ForegroundColor Yellow
    $missingFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
}

# Создание временной директории
$tempDir = Join-Path $env:TEMP "tashi-ani-clean-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "`n📋 Копирование файлов..." -ForegroundColor Cyan

# Копирование файлов
foreach ($item in $filesToInclude) {
    if (Test-Path $item) {
        $destPath = Join-Path $tempDir $item
        $destParent = Split-Path $destPath -Parent
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -Path $item -Destination $destPath -Recurse -Force
        Write-Host "   ✓ $item" -ForegroundColor Gray
    }
}

# Исключаем ненужные файлы из public
Write-Host "`n🧹 Очистка public/uploads..." -ForegroundColor Cyan
$uploadsDir = Join-Path $tempDir "public/uploads"
if (Test-Path $uploadsDir) {
    Remove-Item -Path $uploadsDir -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
    Write-Host "   ✓ public/uploads очищена" -ForegroundColor Gray
}

# Создание архива
Write-Host "`n📦 Создание ZIP архива..." -ForegroundColor Cyan
$archivePath = Join-Path $projectRoot "tashi-ani-clean.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $archivePath -Force

# Очистка временной директории
Remove-Item -Path $tempDir -Recurse -Force

# Проверка размера архива
$archiveSize = (Get-Item $archivePath).Length / 1MB
Write-Host "`n✅ Архив создан успешно!" -ForegroundColor Green
Write-Host "   Путь: $archivePath" -ForegroundColor Gray
Write-Host "   Размер: $([math]::Round($archiveSize, 2)) MB" -ForegroundColor Gray

Write-Host "`n📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   1. Загрузите архив на сервер reg.ru" -ForegroundColor White
Write-Host "   2. Распакуйте архив в /var/www/tashi-ani/" -ForegroundColor White
Write-Host "   3. Следуйте инструкциям из FULL_SERVER_REINSTALL.md" -ForegroundColor White
Write-Host ""




