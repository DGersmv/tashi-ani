/**
 * Скрипт для автоматической замены проверок PostgreSQL boolean ('t'/'f') на MySQL-совместимые
 */

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

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Заменяем проверки === 't' на dbBool()
  const patterns = [
    // === 't' -> dbBool()
    [/(\w+)\s*===\s*['"]t['"]/g, 'dbBool($1)'],
    [/(\w+)\s*==\s*['"]t['"]/g, 'dbBool($1)'],
    // !== 't' -> !dbBool()
    [/(\w+)\s*!==\s*['"]t['"]/g, '!dbBool($1)'],
    [/(\w+)\s*!=\s*['"]t['"]/g, '!dbBool($1)'],
    // === 'f' -> !dbBool()
    [/(\w+)\s*===\s*['"]f['"]/g, '!dbBool($1)'],
    [/(\w+)\s*==\s*['"]f['"]/g, '!dbBool($1)'],
    // !== 'f' -> dbBool()
    [/(\w+)\s*!==\s*['"]f['"]/g, 'dbBool($1)'],
    [/(\w+)\s*!=\s*['"]f['"]/g, 'dbBool($1)'],
  ];
  
  patterns.forEach(([pattern, replacement]) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Более сложные замены для массивов
  // ['is_visible_to_customer'] === 't' -> dbBool($row['is_visible_to_customer'])
  const arrayPatterns = [
    [/(\$[\w\[\]'"]+)\s*===\s*['"]t['"]/g, 'dbBool($1)'],
    [/(\$[\w\[\]'"]+)\s*==\s*['"]t['"]/g, 'dbBool($1)'],
    [/(\$[\w\[\]'"]+)\s*!==\s*['"]t['"]/g, '!dbBool($1)'],
    [/(\$[\w\[\]'"]+)\s*!=\s*['"]t['"]/g, '!dbBool($1)'],
  ];
  
  arrayPatterns.forEach(([pattern, replacement]) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Добавляем require_once для db.php если его нет и используются функции dbBool
  if (modified && content.includes('dbBool') && !content.includes('require_once') && !content.includes('require ')) {
    const dbRequire = "require_once __DIR__ . '/../db.php';\n";
    // Вставляем после открывающего тега PHP
    content = content.replace(/^<\?php\s*\n/, `<?php\n${dbRequire}`);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

console.log('🔧 Исправление проверок boolean для MySQL...\n');

const phpFiles = findPhpFiles(apiDir);
let fixed = 0;

phpFiles.forEach(file => {
  if (fixFile(file)) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✅ Исправлен: ${relativePath}`);
    fixed++;
  }
});

console.log(`\n📊 Исправлено файлов: ${fixed} из ${phpFiles.length}`);
