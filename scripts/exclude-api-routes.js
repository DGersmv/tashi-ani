/**
 * Временный скрипт для переименования API routes перед сборкой
 * чтобы Next.js не пытался их экспортировать
 */

const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'src', 'app', 'api');
const apiBackupPath = path.join(__dirname, '..', 'src', 'app', '_api_backup');

function excludeApiRoutes() {
  if (fs.existsSync(apiPath)) {
    console.log('📦 Переименование API routes для исключения из сборки...');
    if (fs.existsSync(apiBackupPath)) {
      fs.rmSync(apiBackupPath, { recursive: true, force: true });
    }
    fs.renameSync(apiPath, apiBackupPath);
    console.log('✅ API routes временно переименованы');
  }
}

function restoreApiRoutes() {
  if (fs.existsSync(apiBackupPath)) {
    console.log('📦 Восстановление API routes...');
    if (fs.existsSync(apiPath)) {
      fs.rmSync(apiPath, { recursive: true, force: true });
    }
    fs.renameSync(apiBackupPath, apiPath);
    console.log('✅ API routes восстановлены');
  }
}

// Если скрипт вызван напрямую
if (require.main === module) {
  const command = process.argv[2];
  if (command === 'exclude') {
    excludeApiRoutes();
  } else if (command === 'restore') {
    restoreApiRoutes();
  } else {
    console.log('Использование: node exclude-api-routes.js [exclude|restore]');
  }
}

module.exports = { excludeApiRoutes, restoreApiRoutes };
