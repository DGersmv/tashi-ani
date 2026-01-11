/**
 * Скрипт для запуска PHP встроенного сервера
 * Использование: npm run php:dev
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

function findPhpPath() {
  // Список возможных путей к PHP
  const possiblePaths = [
    'php', // Если в PATH
    'C:\\xampp\\php\\php.exe',
    'C:\\Program Files\\xampp\\php\\php.exe',
    'C:\\wamp64\\bin\\php\\php8.1.0\\php.exe',
    'C:\\wamp64\\bin\\php\\php8.2.0\\php.exe',
  ];
  
  for (const phpPath of possiblePaths) {
    try {
      execSync(`"${phpPath}" -v`, { stdio: 'ignore' });
      return phpPath;
    } catch (error) {
      // Пробуем следующий путь
    }
  }
  
  return null;
}

const phpPath = findPhpPath();

if (!phpPath) {
  console.error('❌ PHP не найден!');
  console.error('   Проверьте установку XAMPP или добавьте PHP в PATH');
  console.error('   См. ЛОКАЛЬНОЕ_ТЕСТИРОВАНИЕ_PHP.md для инструкций');
  process.exit(1);
}

console.log(`🚀 Запуск PHP сервера...`);
console.log(`   PHP: ${phpPath}`);
console.log(`   URL: http://localhost:8000`);
console.log(`   Нажмите Ctrl+C для остановки\n`);

// Запускаем PHP сервер
const server = spawn(`"${phpPath}"`, ['-S', 'localhost:8000', '-t', '.'], {
  shell: true,
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('❌ Ошибка запуска сервера:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`\n❌ Сервер завершился с кодом ${code}`);
  } else {
    console.log('\n✅ Сервер остановлен');
  }
});

// Обработка Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Остановка сервера...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit(0);
});
