/**
 * Скрипт для проверки синтаксиса всех PHP файлов
 * Использование: npm run php:check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'api');

function findPhpFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findPhpFiles(filePath));
    } else if (file.endsWith('.php')) {
      results.push(filePath);
    }
  });
  
  return results;
}

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

function checkPhpSyntax() {
  console.log('🔍 Проверка синтаксиса PHP файлов...\n');
  
  // Ищем PHP
  const phpPath = findPhpPath();
  if (!phpPath) {
    console.error('❌ PHP не найден!');
    console.error('   Проверьте установку XAMPP или добавьте PHP в PATH');
    console.error('   См. ЛОКАЛЬНОЕ_ТЕСТИРОВАНИЕ_PHP.md для инструкций\n');
    process.exit(1);
  }
  
  console.log(`✅ PHP найден: ${phpPath}\n`);
  
  const phpFiles = findPhpFiles(apiDir);
  let errors = 0;
  let checked = 0;
  
  phpFiles.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    try {
      execSync(`"${phpPath}" -l "${file}"`, { stdio: 'pipe' });
      console.log(`✅ ${relativePath}`);
      checked++;
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      console.error(`❌ ${relativePath}`);
      console.error(`   ${output.split('\n').filter(l => l.trim()).join('\n   ')}`);
      errors++;
    }
  });
  
  console.log(`\n📊 Проверено: ${checked} файлов`);
  if (errors > 0) {
    console.error(`❌ Ошибок: ${errors}`);
    process.exit(1);
  } else {
    console.log('✅ Все файлы синтаксически корректны!');
  }
}

checkPhpSyntax();
