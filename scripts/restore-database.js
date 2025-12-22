const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { execSync } = require('child_process');

async function restoreDatabase(sourceDb, targetDb) {
  console.log(`\n=== Восстановление базы данных ===\n`);
  console.log(`Источник: ${sourceDb}`);
  console.log(`Целевая БД: ${targetDb}\n`);

  if (!fs.existsSync(sourceDb)) {
    console.log(`❌ Исходный файл не найден: ${sourceDb}`);
    process.exit(1);
  }

  // Проверяем наличие sqlite3
  let hasSqlite3 = false;
  try {
    execSync('which sqlite3', { stdio: 'ignore' });
    hasSqlite3 = true;
  } catch (e) {
    console.log('⚠️  sqlite3 не установлен. Устанавливаю...');
    try {
      execSync('sudo apt-get update && sudo apt-get install -y sqlite3', { stdio: 'inherit' });
      hasSqlite3 = true;
    } catch (installError) {
      console.log('❌ Не удалось установить sqlite3 автоматически.');
      console.log('Установите вручную: sudo apt-get install sqlite3');
      process.exit(1);
    }
  }

  // Создаем бэкап целевой БД
  if (fs.existsSync(targetDb)) {
    const backupPath = `${targetDb}.backup.${Date.now()}`;
    console.log(`📦 Создаю бэкап текущей БД: ${backupPath}`);
    fs.copyFileSync(targetDb, backupPath);
    console.log('✅ Бэкап создан\n');
  }

  // Создаем директорию если не существует
  const targetDir = require('path').dirname(targetDb);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Делаем дамп из исходной БД
  const dumpFile = `/tmp/db_dump_${Date.now()}.sql`;
  console.log(`📤 Создаю дамп из исходной БД...`);
  try {
    execSync(`sqlite3 "${sourceDb}" ".dump" > "${dumpFile}"`, { stdio: 'inherit' });
    console.log('✅ Дамп создан\n');
  } catch (e) {
    console.log(`❌ Ошибка при создании дампа: ${e.message}`);
    process.exit(1);
  }

  // Восстанавливаем в целевую БД
  console.log(`📥 Восстанавливаю данные в целевую БД...`);
  try {
    // Удаляем старую БД если существует
    if (fs.existsSync(targetDb)) {
      fs.unlinkSync(targetDb);
    }
    
    execSync(`sqlite3 "${targetDb}" < "${dumpFile}"`, { stdio: 'inherit' });
    console.log('✅ Данные восстановлены\n');
  } catch (e) {
    console.log(`❌ Ошибка при восстановлении: ${e.message}`);
    process.exit(1);
  }

  // Удаляем временный файл
  if (fs.existsSync(dumpFile)) {
    fs.unlinkSync(dumpFile);
  }

  // Проверяем результат
  console.log('🔍 Проверка восстановленных данных...');
  try {
    const userCount = execSync(`sqlite3 "${targetDb}" "SELECT COUNT(*) FROM User;"`, { encoding: 'utf-8' }).trim();
    const objectCount = execSync(`sqlite3 "${targetDb}" "SELECT COUNT(*) FROM Object;"`, { encoding: 'utf-8' }).trim();
    
    console.log(`✅ Пользователей восстановлено: ${userCount}`);
    console.log(`✅ Объектов восстановлено: ${objectCount}\n`);
    
    console.log('✅ Восстановление завершено успешно!');
    console.log('⚠️  Не забудьте перезапустить приложение: pm2 restart tashi-ani');
  } catch (e) {
    console.log(`⚠️  Не удалось проверить результат: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Использование: node restore-database.js <исходная_БД> <целевая_БД>');
    console.log('\nПример:');
    console.log('  node restore-database.js /var/lib/tashi-ani/prod.db /var/lib/tashi-ani/db/tashi-ani.db');
    console.log('\n⚠️  ВНИМАНИЕ: Это перезапишет целевую БД!');
    process.exit(1);
  }

  const sourceDb = args[0];
  const targetDb = args[1];

  console.log('⚠️  ВНИМАНИЕ: Это действие перезапишет целевую базу данных!');
  console.log('Нажмите Ctrl+C для отмены или Enter для продолжения...');
  
  // В production лучше использовать readline, но для простоты используем таймаут
  await new Promise(resolve => setTimeout(resolve, 3000));

  await restoreDatabase(sourceDb, targetDb);
}

main().catch(console.error);

