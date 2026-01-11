/**
 * Создаёт временную копию проекта без API routes и собирает её
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const tempDir = path.join(rootDir, '.build-temp');

console.log('🚀 Создаю временную копию проекта без API routes...\n');

// Очистить старую временную папку
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Функция копирования с исключением API routes
function copyWithoutApi(src, dest, excludeApi = false) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    // Пропускаем папку api
    if (path.basename(src) === 'api' && excludeApi) {
      return;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyWithoutApi(srcPath, destPath, excludeApi || path.basename(src) === 'app');
    });
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

// Копируем нужные файлы и папки
const itemsToCopy = [
  'src/app',
  'src/components',
  'src/lib',
  'src/styles',
  'src/types',
  'public',
  'prisma',
  'next.config.js',
  'package.json',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  '.env.local',
  '.env'
];

itemsToCopy.forEach(item => {
  const srcPath = path.join(rootDir, item);
  if (fs.existsSync(srcPath)) {
    const destPath = path.join(tempDir, item);
    const isApp = item === 'src/app';
    copyWithoutApi(srcPath, destPath, isApp);
    console.log(`✅ Скопировано: ${item}`);
  }
});

// Создаём node_modules симлинк или копируем package.json и устанавливаем зависимости
console.log('\n📦 Устанавливаю зависимости во временной папке...');
execSync('npm install', { stdio: 'inherit', cwd: tempDir });

// Собираем проект
console.log('\n📦 Собираю Next.js...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: tempDir });
  
  // Копируем результат обратно
  const tempOut = path.join(tempDir, 'out');
  const rootOut = path.join(rootDir, 'out');
  
  if (fs.existsSync(tempOut)) {
    if (fs.existsSync(rootOut)) {
      fs.rmSync(rootOut, { recursive: true, force: true });
    }
    fs.renameSync(tempOut, rootOut);
    console.log('\n✅ Сборка завершена! Папка out создана.\n');
  }
} catch (error) {
  console.error('\n❌ Ошибка при сборке!');
  process.exit(1);
} finally {
  // Очищаем временную папку
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('🧹 Временная папка очищена');
  }
}

console.log('\n✅ Готово! Теперь можно запустить: npm run build:dist');
