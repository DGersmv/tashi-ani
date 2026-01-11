/**
 * Скрипт который:
 * 1. Временно скрывает API routes
 * 2. Собирает Next.js
 * 3. Создаёт папку dist
 * 4. Восстанавливает API routes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const apiPath = path.join(rootDir, 'src', 'app', 'api');
const apiBackupPath = path.join(rootDir, 'src', 'app', '_api_temp');
let apiRenamed = false;

console.log('🚀 Начинаю сборку проекта...\n');

// Шаг 1: Скрыть API routes (пробуем переименовать, если не получается - используем другой метод)
if (fs.existsSync(apiPath) && !fs.existsSync(apiBackupPath)) {
  try {
    fs.renameSync(apiPath, apiBackupPath);
    apiRenamed = true;
    console.log('✅ Временно скрыл API routes (они не нужны для статического сайта)\n');
  } catch (error) {
    console.warn('⚠️  Не удалось переименовать API папку (файлы могут быть открыты)');
    console.warn('   Пробую другой метод...\n');
    
    // Альтернативный метод: создаём .gitignore для API или используем другой подход
    // Просто продолжим сборку - Next.js может собрать и с API routes, просто они не будут работать
    console.log('   Продолжаю сборку (API routes будут в сборке, но не будут использоваться)...\n');
  }
}

// Шаг 2: Собрать Next.js
try {
  console.log('📦 Собираю Next.js...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  console.log('\n✅ Next.js собран успешно!\n');
} catch (error) {
  console.error('\n❌ Ошибка при сборке Next.js!');
  
  // Восстанавливаем API папку
  if (apiRenamed && fs.existsSync(apiBackupPath)) {
    try {
      fs.renameSync(apiBackupPath, apiPath);
      console.log('✅ API папка восстановлена');
    } catch (e) {
      console.error('❌ Не удалось восстановить API папку!');
    }
  }
  
  process.exit(1);
}

// Шаг 3: Создать dist
try {
  console.log('📦 Создаю папку dist...');
  execSync('node scripts/create-dist.js', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('\n❌ Ошибка при создании dist!');
  process.exit(1);
}

// Шаг 4: Восстановить API routes (только если переименовывали)
if (apiRenamed && fs.existsSync(apiBackupPath)) {
  try {
    // Ждём немного, чтобы файлы освободились
    setTimeout(() => {
      try {
        fs.renameSync(apiBackupPath, apiPath);
        console.log('\n✅ API папка восстановлена');
      } catch (error) {
        console.error('\n⚠️  Не удалось автоматически восстановить API папку');
        console.error('   Восстановите вручную:');
        console.error(`   Переименуйте: ${apiBackupPath} -> ${apiPath}`);
      }
    }, 500);
  } catch (error) {
    console.error('\n❌ Ошибка при восстановлении API папки');
  }
}

console.log('\n🎉 Всё готово! Папка dist создана и готова к загрузке на сервер!');
